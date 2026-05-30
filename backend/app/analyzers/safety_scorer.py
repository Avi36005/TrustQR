from typing import List
from app.schemas import CheckResult

# Labels that correspond to danger-level failures
DANGER_LABELS = {
    "Collect request detected",
    "Known scam UPI ID",
    "Known scam domain",
    "APK download link",
    "Brand lookalike / typosquatting",
    "Google Safe Browsing",
    "URLhaus threat database",
    "Valid UPI ID format",
}

# Labels that correspond to warning-level failures
WARNING_LABELS = {
    "Amount pre-filled",
    "Uses HTTPS",
    "URL shortener detected",
    "Domain age check",
    "Redirect chain",
    "Tracking parameters",
    "Network security type",
    "Open network check",
    "Unknown network warning",
    "Hidden network",
    "Password in QR code",
    "Transaction note review",
}


def compute_safety(checks: List[CheckResult]) -> str:
    """
    Compute overall safety level based on check results.
    - Any danger-level check failure → 'danger'
    - 2+ warning-level check failures → 'caution'
    - else → 'safe'
    """
    danger_count = 0
    warning_count = 0

    # checks with warning=True count as caution-level, never danger
    warning_count += sum(1 for c in checks if not c.passed and getattr(c, 'warning', False))

    for check in checks:
        if check.passed:
            continue

        # warning=True checks already counted above — skip danger/warning label logic for them
        if getattr(check, 'warning', False):
            continue

        label = check.label
        if label in DANGER_LABELS:
            danger_count += 1
        elif label in WARNING_LABELS:
            warning_count += 1
        else:
            # Unknown label failures default to warnings
            warning_count += 1

    if danger_count > 0:
        return "danger"
    elif warning_count >= 2:
        return "caution"
    else:
        return "safe"


def classify_qr_type(content: str) -> str:
    """
    Classify the type of QR code based on its content.
    Returns: 'upi', 'url', 'wifi', or 'text'
    """
    import re
    c = content.strip()
    cl = c.lower()

    if cl.startswith("upi://"):
        return "upi"
    if cl.startswith(("http://", "https://")):
        return "url"
    if c.upper().startswith("WIFI:"):
        return "wifi"
    # www. or bare domain-like URLs
    if cl.startswith("www."):
        return "url"
    # Looks like a domain/URL (e.g. "google.com/path" or "flipkart.com?...")
    if re.match(r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([/?#]|$)', c):
        return "url"
    return "text"


def generate_verdict(safety: str, qr_type: str, checks: List[CheckResult]) -> str:
    """Generate a human-readable verdict string."""
    if safety == "danger":
        failed = [c for c in checks if not c.passed and c.label in DANGER_LABELS]
        if failed:
            return f"DANGER: {failed[0].value or failed[0].label}"
        return "This QR code contains dangerous content — do not proceed."

    elif safety == "caution":
        failed = [c for c in checks if not c.passed]
        if failed:
            return f"Caution: {len(failed)} issue(s) found — review carefully before proceeding."
        return "Proceed with caution."

    else:
        type_labels = {
            "upi": "This appears to be a legitimate UPI payment QR code.",
            "url": "This URL appears safe to visit.",
            "wifi": "Network details look standard — connect only if you trust the source.",
            "text": "QR code contains plain text — no threats detected.",
        }
        return type_labels.get(qr_type, "QR code appears safe.")
