"""
UPI QR analyzer.

Handles deep-links like:
  upi://pay?pa=handle@provider&pn=Name&am=100&cu=INR&tn=note&mode=collect
"""

import re
import logging
from urllib.parse import urlparse, parse_qs
from typing import Any

from sqlalchemy.orm import Session

from app.models import ScamUpiId

logger = logging.getLogger(__name__)

# UPI IDs have the form: localpart@provider
UPI_ID_PATTERN = re.compile(r"^[a-zA-Z0-9._\-+]+@[a-zA-Z0-9]+$")

# Suspicious prefixes that appear in scam UPI IDs
SUSPICIOUS_PREFIXES = [
    "refund", "cashback", "support", "helpdesk", "care", "reward",
    "offer", "prize", "winner", "lucky", "free", "claim", "official",
    "kyc", "aadhar", "pan", "otp", "security", "urgent", "emergency",
    "loan", "job", "work", "earn", "crypto", "bitcoin", "lottery",
    "jackpot", "gift", "voucher",
]

# Regex: payee name looks suspicious if it has digits or special chars or is very short
SUSPICIOUS_PAYEE_PATTERN = re.compile(r"[0-9!@#$%^&*(){}<>]")


def _check_upi_in_db(upi_id: str, db: Session) -> bool:
    try:
        row = db.query(ScamUpiId).filter(
            ScamUpiId.upi_id == upi_id.lower()
        ).first()
        return row is not None
    except Exception as exc:
        logger.warning("DB lookup failed for UPI %s: %s", upi_id, exc)
        return False


def analyze_upi(content: str, db: Session) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    # Strip leading "upi://" if present so urlparse can handle it
    try:
        parsed = urlparse(content)
        params = parse_qs(parsed.query)
    except Exception:
        return {
            "checks": [{"label": "UPI parse error", "passed": False,
                        "value": "could not parse", "severity": "danger"}],
            "upi_info": None,
            "direction": "unknown",
        }

    def first(key: str, default: str = "") -> str:
        return params.get(key, [default])[0]

    pa = first("pa")          # payee address (UPI ID)
    pn = first("pn")          # payee name
    am = first("am")          # amount
    tn = first("tn")          # transaction note
    mode = first("mode")      # collect / pay

    # 1. UPI ID format check
    format_valid = bool(pa and UPI_ID_PATTERN.match(pa))
    checks.append({
        "label": "UPI ID format valid",
        "passed": format_valid,
        "value": pa or "missing",
        "severity": "danger" if not format_valid else "info",
    })

    # 2. Collect-request check (money leaves the user's account automatically)
    is_collect = "collect" in mode.lower() or mode == "02"
    checks.append({
        "label": "Collect request (money leaves account)",
        "passed": not is_collect,
        "value": "YES – this is a collect request" if is_collect else "no",
        "severity": "danger" if is_collect else "info",
    })

    # 3. Pre-filled amount
    try:
        amount_val = float(am) if am else 0.0
    except ValueError:
        amount_val = 0.0
    amount_prefilled = amount_val > 0
    checks.append({
        "label": "Amount pre-filled",
        "passed": not amount_prefilled,
        "value": f"₹{am}" if amount_prefilled else "none",
        "severity": "warning" if amount_prefilled else "info",
    })

    # 4. Known scam UPI ID
    in_db = _check_upi_in_db(pa, db) if pa else False
    checks.append({
        "label": "UPI ID in scam database",
        "passed": not in_db,
        "value": "FOUND IN SCAM DATABASE" if in_db else "not found",
        "severity": "danger" if in_db else "info",
    })

    # 5. Suspicious payee name
    suspicious_payee = False
    if pn:
        suspicious_payee = bool(SUSPICIOUS_PAYEE_PATTERN.search(pn)) or len(pn) < 3
    checks.append({
        "label": "Payee name looks suspicious",
        "passed": not suspicious_payee,
        "value": pn or "missing",
        "severity": "warning" if suspicious_payee else "info",
    })

    # 6. Suspicious prefix in UPI ID
    suspicious_prefix = False
    if pa:
        local_part = pa.split("@")[0].lower()
        suspicious_prefix = any(local_part.startswith(p) for p in SUSPICIOUS_PREFIXES)
    checks.append({
        "label": "Suspicious prefix in UPI ID",
        "passed": not suspicious_prefix,
        "value": pa.split("@")[0] if pa and suspicious_prefix else "none",
        "severity": "warning" if suspicious_prefix else "info",
    })

    direction = "incoming" if is_collect else "outgoing"

    upi_info = {
        "upi_id": pa,
        "payee_name": pn,
        "amount": am,
        "note": tn,
        "mode": mode,
        "direction": direction,
    }

    return {
        "checks": checks,
        "upi_info": upi_info,
        "direction": direction,
    }
