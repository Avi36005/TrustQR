import re
from typing import List, Tuple, Optional
from urllib.parse import urlparse, parse_qs

import requests
import tldextract

from app.schemas import UrlInfo, CheckResult
from app.services.safe_browsing import check_safe_browsing
from app.services.urlhaus import check_urlhaus
from app.services.whois_service import get_domain_age_days


KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "ow.ly", "t.co", "goo.gl",
    "short.ly", "is.gd", "buff.ly", "ift.tt", "dlvr.it",
    "tiny.cc", "lnkd.in", "rb.gy", "cutt.ly", "shorturl.at",
}

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "msclkid", "mc_eid", "ref", "_ga", "igshid",
    "twclid", "li_fat_id", "ttclid",
}

# Brand lookalike patterns — Indian banks and payment apps
BRAND_PATTERNS = {
    "paytm": ["payttm", "paytm-", "paytm0", "paytrn", "paytnn", "p4ytm", "pa4tm"],
    "phonepe": ["phonep3", "ph0nepe", "phonpe", "ph0ne-pe", "phonepe-"],
    "gpay": ["gp4y", "g-pay", "googlepay-", "gpay-"],
    "sbi": ["sbi-", "sbionline", "sbi0", "sbi_", "sbii"],
    "hdfc": ["hdfc-", "hdfcbank-", "h1fc", "hdfcc"],
    "icici": ["icicii", "icici-", "1cici", "icicl"],
    "axis": ["axisbank-", "axis-", "ax1s", "axi5"],
    "kotak": ["kotak-", "k0tak", "kotakk"],
    "boi": ["bankofindia-", "boi-"],
    "pnb": ["pnb-", "pnjab"],
    "union": ["unionbank-", "unionbankofindia-"],
    "canara": ["canara-", "canarabank-"],
    "amazon": ["amaz0n", "amazn", "am4zon", "amazon-pay", "amazonpay-"],
    "flipkart": ["fllipkart", "flipkart-", "fl1pkart"],
}


def is_brand_lookalike(domain: str) -> Optional[str]:
    """Check if domain looks like a brand impersonation. Returns brand name or None."""
    domain_lower = domain.lower()

    for brand, typos in BRAND_PATTERNS.items():
        for typo in typos:
            if typo in domain_lower:
                return brand

    # Also check for brand name with suspicious TLDs
    suspicious_tlds = [".net", ".info", ".xyz", ".tk", ".ml", ".ga", ".cf", ".click", ".loan", ".buzz"]
    for brand in BRAND_PATTERNS.keys():
        if brand in domain_lower:
            for tld in suspicious_tlds:
                if domain_lower.endswith(tld):
                    return brand

    return None


def follow_redirects(url: str, max_hops: int = 5, timeout: float = 2.0) -> List[str]:
    """Follow URL redirects and return the redirect chain."""
    chain = [url]
    current_url = url

    try:
        session = requests.Session()
        session.max_redirects = max_hops

        # Use HEAD first, fall back to GET
        try:
            response = session.get(
                current_url,
                allow_redirects=True,
                timeout=timeout,
                stream=True,
                headers={"User-Agent": "TrustQR-Scanner/1.0"},
            )
            # Build redirect chain from response history
            for r in response.history:
                if r.url not in chain:
                    chain.append(r.url)
            if response.url not in chain:
                chain.append(response.url)
        except requests.TooManyRedirects as e:
            pass
        except Exception:
            pass
    except Exception:
        pass

    return chain


def count_tracking_params(url: str) -> int:
    """Count the number of known tracking parameters in a URL."""
    try:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        count = sum(1 for key in params if key.lower() in TRACKING_PARAMS)
        return count
    except Exception:
        return 0


def analyze_url(content: str, scam_domains: List[str]) -> Tuple[UrlInfo, List[CheckResult]]:
    """
    Analyze a URL QR code content.
    Returns a tuple of (UrlInfo, list of CheckResult items).
    """
    checks: List[CheckResult] = []
    url = content.strip()

    # Extract domain info
    extracted = tldextract.extract(url)
    domain = f"{extracted.domain}.{extracted.suffix}" if extracted.suffix else extracted.domain
    full_domain = extracted.fqdn or domain

    # --- Check 1: HTTPS ---
    is_https = url.lower().startswith("https://")
    checks.append(
        CheckResult(
            label="Uses HTTPS",
            passed=is_https,
            value="Secure connection" if is_https else "Insecure HTTP — data may be visible to attackers",
        )
    )

    # --- Check 2: URL shortener ---
    is_shortener = full_domain.lower() in KNOWN_SHORTENERS or domain.lower() in KNOWN_SHORTENERS
    checks.append(
        CheckResult(
            label="URL shortener detected",
            passed=not is_shortener,
            value=f"Uses URL shortener ({domain}) — actual destination is hidden" if is_shortener else "Direct URL",
        )
    )

    # --- Check 3: APK download check ---
    has_apk = ".apk" in url.lower()
    checks.append(
        CheckResult(
            label="APK download link",
            passed=not has_apk,
            value="Links to an APK file — installing unknown apps is very risky" if has_apk else "No APK download detected",
        )
    )

    # --- Check 4: Brand lookalike ---
    lookalike_brand = is_brand_lookalike(domain)
    checks.append(
        CheckResult(
            label="Brand lookalike / typosquatting",
            passed=lookalike_brand is None,
            value=f"Domain appears to impersonate '{lookalike_brand}'" if lookalike_brand else "No brand impersonation detected",
        )
    )

    # --- Check 5: Known scam domain ---
    scam_domains_lower = [d.lower() for d in scam_domains]
    is_known_scam_domain = domain.lower() in scam_domains_lower or full_domain.lower() in scam_domains_lower
    checks.append(
        CheckResult(
            label="Known scam domain",
            passed=not is_known_scam_domain,
            value="This domain is in the known scam/phishing database" if is_known_scam_domain else "Not in scam domain database",
        )
    )

    # --- Check 6: Domain age (WHOIS) ---
    domain_age_days = get_domain_age_days(domain)
    if domain_age_days is not None:
        if domain_age_days < 7:
            age_label = f"Domain is only {domain_age_days} days old — extremely new"
            age_passed = False
        elif domain_age_days < 30:
            age_label = f"Caution: Domain is only {domain_age_days} days old — recently registered"
            age_passed = False
        else:
            age_label = f"Domain is {domain_age_days} days old"
            age_passed = True
        checks.append(
            CheckResult(
                label="Domain age check",
                passed=age_passed,
                value=age_label,
            )
        )
    else:
        checks.append(
            CheckResult(
                label="Domain age check",
                passed=True,
                value="Could not determine domain age",
            )
        )

    # --- Check 7: Follow redirects ---
    redirect_chain = follow_redirects(url)
    has_many_redirects = len(redirect_chain) > 3
    checks.append(
        CheckResult(
            label="Redirect chain",
            passed=not has_many_redirects,
            value=f"Caution: {len(redirect_chain) - 1} redirects detected" if has_many_redirects else f"{len(redirect_chain) - 1} redirect(s)",
        )
    )

    # Final URL after redirects
    final_url = redirect_chain[-1] if redirect_chain else url

    # --- Check 8: Tracking parameters ---
    trackers_count = count_tracking_params(final_url)
    has_many_trackers = trackers_count >= 3
    checks.append(
        CheckResult(
            label="Tracking parameters",
            passed=not has_many_trackers,
            value=f"Caution: {trackers_count} tracking parameters detected" if has_many_trackers else f"{trackers_count} tracking parameter(s)",
        )
    )

    # --- Check 9: Google Safe Browsing ---
    on_safe_browsing_list = check_safe_browsing(final_url)
    checks.append(
        CheckResult(
            label="Google Safe Browsing",
            passed=not on_safe_browsing_list,
            value="Flagged by Google Safe Browsing" if on_safe_browsing_list else "Not flagged by Google Safe Browsing",
        )
    )

    # --- Check 10: URLhaus blocklist ---
    on_urlhaus = check_urlhaus(final_url)
    checks.append(
        CheckResult(
            label="URLhaus threat database",
            passed=not on_urlhaus,
            value="Active malware/phishing URL in URLhaus database" if on_urlhaus else "Not found in URLhaus database",
        )
    )

    on_blocklist = on_safe_browsing_list or on_urlhaus or is_known_scam_domain

    url_info = UrlInfo(
        domain=domain,
        domain_age_days=domain_age_days,
        https=is_https,
        redirect_chain=redirect_chain,
        trackers_count=trackers_count,
        on_blocklist=on_blocklist,
    )

    return url_info, checks
