"""
URL QR analyzer.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, parse_qs

import requests
import tldextract
from sqlalchemy.orm import Session

from app.models import KnownScamDomain
from app.services.safe_browsing import check_safe_browsing
from app.services.urlhaus import check_urlhaus
from app.services.whois_service import get_domain_age_days

logger = logging.getLogger(__name__)

KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "ow.ly", "t.co", "goo.gl",
    "is.gd", "cutt.ly", "buff.ly", "rb.gy", "shorturl.at",
    "tiny.cc", "lnkd.in", "trib.al",
}

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "msclkid", "twclid", "mc_eid", "ref", "_ga",
}

_BRAND_DOMAINS: list[str] = []

def _load_brand_domains() -> list[str]:
    global _BRAND_DOMAINS
    if _BRAND_DOMAINS:
        return _BRAND_DOMAINS
    data_path = Path(__file__).parent.parent / "data" / "brand_domains.json"
    try:
        with open(data_path) as f:
            _BRAND_DOMAINS = json.load(f)
    except Exception as exc:
        logger.warning("Could not load brand_domains.json: %s", exc)
        _BRAND_DOMAINS = []
    return _BRAND_DOMAINS


def _levenshtein(s1: str, s2: str) -> int:
    """Simple Levenshtein distance."""
    if len(s1) < len(s2):
        return _levenshtein(s2, s1)
    if not s2:
        return len(s1)
    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (c1 != c2)))
        prev = curr
    return prev[-1]


def _is_brand_lookalike(domain: str) -> tuple[bool, str]:
    """Return (True, matched_brand) if domain looks like a brand lookalike."""
    brand_domains = _load_brand_domains()
    for brand in brand_domains:
        brand_core = brand.split(".")[0].lower()
        domain_core = domain.split(".")[0].lower()
        if domain_core == brand_core:
            return False, ""  # exact match — not a lookalike
        dist = _levenshtein(domain_core, brand_core)
        # Flag if distance is small but not identical, and domain contains brand name
        if dist <= 2 and len(domain_core) > 3:
            return True, brand
        if brand_core in domain_core and domain_core != brand_core:
            return True, brand
    return False, ""


def _follow_redirects(url: str) -> tuple[str, list[str]]:
    """Follow redirects up to 5 hops with 2s timeout. Return (final_url, chain)."""
    chain: list[str] = [url]
    try:
        resp = requests.get(url, timeout=2, allow_redirects=True, stream=True)
        resp.close()
        for r in resp.history:
            if r.headers.get("Location"):
                chain.append(r.headers["Location"])
        final = resp.url
        if final not in chain:
            chain.append(final)
        return final, chain[:5]
    except Exception as exc:
        logger.debug("Redirect follow failed for %s: %s", url, exc)
        return url, chain


def _check_in_scam_db(domain: str, db: Session) -> tuple[bool, str]:
    try:
        row = db.query(KnownScamDomain).filter(
            KnownScamDomain.domain == domain.lower()
        ).first()
        if row:
            return True, row.category
        return False, ""
    except Exception as exc:
        logger.warning("DB lookup failed for domain %s: %s", domain, exc)
        return False, ""


def analyze_url(content: str, db: Session) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    url_info: dict[str, Any] = {}

    # Normalise: add scheme if missing
    raw = content.strip()
    if not raw.startswith(("http://", "https://", "ftp://")):
        raw = "https://" + raw

    try:
        parsed = urlparse(raw)
        ext = tldextract.extract(raw)
        domain = f"{ext.domain}.{ext.suffix}" if ext.suffix else ext.domain
        subdomain = ext.subdomain
    except Exception as exc:
        return {
            "checks": [{"label": "URL parse error", "passed": False,
                        "value": str(exc), "severity": "danger"}],
            "url_info": {},
        }

    url_info["original_url"] = content
    url_info["domain"] = domain
    url_info["subdomain"] = subdomain or None

    # 1. Known URL shortener
    is_shortener = domain in KNOWN_SHORTENERS
    checks.append({
        "label": "Known URL shortener",
        "passed": not is_shortener,
        "value": domain if is_shortener else "no",
        "severity": "warning" if is_shortener else "info",
    })

    # 2. Known scam domain
    in_scam_db, scam_category = _check_in_scam_db(domain, db)
    checks.append({
        "label": "Domain in scam database",
        "passed": not in_scam_db,
        "value": scam_category if in_scam_db else "not found",
        "severity": "danger" if in_scam_db else "info",
    })

    # 3. WHOIS domain age
    age_days = None
    try:
        age_days = get_domain_age_days(domain)
    except Exception as exc:
        logger.debug("WHOIS failed for %s: %s", domain, exc)
    if age_days is not None:
        url_info["domain_age_days"] = age_days
        young = age_days < 30
        checks.append({
            "label": "Domain is very new (< 30 days)",
            "passed": not young,
            "value": f"{age_days} days old",
            "severity": "warning" if young else "info",
        })
    else:
        checks.append({
            "label": "Domain age check",
            "passed": True,
            "value": "check skipped",
            "severity": "info",
        })

    # 4. Follow redirects
    final_url, redirect_chain = _follow_redirects(raw)
    url_info["redirect_chain"] = redirect_chain
    url_info["final_url"] = final_url

    # 5. HTTPS check on final URL
    uses_https = final_url.startswith("https://")
    checks.append({
        "label": "Final URL uses HTTPS",
        "passed": uses_https,
        "value": final_url[:80],
        "severity": "warning" if not uses_https else "info",
    })

    # 6. APK download
    path = urlparse(final_url).path.lower()
    is_apk = path.endswith(".apk")
    checks.append({
        "label": "Downloads APK file",
        "passed": not is_apk,
        "value": "YES – APK download detected" if is_apk else "no",
        "severity": "danger" if is_apk else "info",
    })

    # 7. Brand lookalike
    is_lookalike, matched_brand = _is_brand_lookalike(domain)
    checks.append({
        "label": "Brand lookalike domain",
        "passed": not is_lookalike,
        "value": f"looks like {matched_brand}" if is_lookalike else "no",
        "severity": "danger" if is_lookalike else "info",
    })

    # 8. Excessive tracking params
    query_params = set(parse_qs(urlparse(final_url).query).keys())
    tracking_found = query_params & TRACKING_PARAMS
    tracking_count = len(tracking_found)
    checks.append({
        "label": "Excessive tracking parameters",
        "passed": tracking_count <= 3,
        "value": f"{tracking_count} found: {', '.join(tracking_found)}" if tracking_found else "none",
        "severity": "warning" if tracking_count > 3 else "info",
    })

    # 9. Google Safe Browsing
    try:
        sb_result = check_safe_browsing(final_url)
        if sb_result is True:
            checks.append({
                "label": "Google Safe Browsing",
                "passed": False,
                "value": "flagged as threat",
                "severity": "danger",
            })
        elif sb_result is False:
            checks.append({
                "label": "Google Safe Browsing",
                "passed": True,
                "value": "clean",
                "severity": "info",
            })
        else:
            checks.append({
                "label": "Google Safe Browsing",
                "passed": True,
                "value": "check skipped (no API key)",
                "severity": "info",
            })
    except Exception as exc:
        logger.warning("Safe Browsing error: %s", exc)
        checks.append({
            "label": "Google Safe Browsing",
            "passed": True,
            "value": "check skipped",
            "severity": "info",
        })

    # 10. URLhaus
    try:
        uh_result = check_urlhaus(final_url)
        if uh_result is True:
            checks.append({
                "label": "URLhaus malware database",
                "passed": False,
                "value": "flagged in URLhaus",
                "severity": "danger",
            })
        else:
            checks.append({
                "label": "URLhaus malware database",
                "passed": True,
                "value": "not found" if uh_result is False else "check skipped",
                "severity": "info",
            })
    except Exception as exc:
        logger.warning("URLhaus error: %s", exc)
        checks.append({
            "label": "URLhaus malware database",
            "passed": True,
            "value": "check skipped",
            "severity": "info",
        })

    return {
        "checks": checks,
        "url_info": url_info,
    }
