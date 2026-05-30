import re
from typing import List, Tuple
from urllib.parse import urlparse, parse_qs

from app.schemas import UpiInfo, CheckResult


# Known valid UPI providers/handles
KNOWN_UPI_HANDLES = {
    "okaxis", "okhdfcbank", "okicici", "oksbi",
    "ybl", "ibl", "axl",
    "paytm", "apl",
    "upi", "icici", "hdfc", "sbi", "axis",
    "kotak", "rbl", "fbl", "citi", "payzapp",
    "abfspay", "barodampay", "mahb", "cub",
    "hdfcbank", "axisbank", "pnb", "psb",
    "airtel", "jio", "bsnl",
    "goaxis", "axisgo",
    "rajgovhdfcbank", "hsbc", "sc",
    "centralbank", "unionbankofindia",
    "indianbank", "idfcbank", "federal",
    "dcb", "equitas", "karb", "vijb",
    "waaxis", "nsdl", "uob",
    "pingpay", "superyes", "lime",
    "phonepe",
}


def parse_upi_uri(content: str) -> dict:
    """Parse a UPI URI and return a dict of its parameters."""
    content = content.strip()

    # Handle standard UPI URI format
    if content.lower().startswith("upi://pay"):
        try:
            parsed = urlparse(content)
            params = parse_qs(parsed.query)
            return {k: v[0] for k, v in params.items()}
        except Exception:
            return {}

    return {}


def is_valid_upi_id(upi_id: str) -> bool:
    """Check if a UPI ID matches the handle@provider pattern."""
    pattern = r"^[a-zA-Z0-9._\-]{2,256}@[a-zA-Z]{2,64}$"
    return bool(re.match(pattern, upi_id))


def analyze_upi(content: str, scam_upi_ids: List[str]) -> Tuple[UpiInfo, List[CheckResult]]:
    """
    Analyze a UPI QR code content.
    Returns a tuple of (UpiInfo, list of CheckResult items).
    """
    params = parse_upi_uri(content)
    checks: List[CheckResult] = []

    # Extract key parameters
    upi_id = params.get("pa", "").strip()
    payee_name = params.get("pn", "Unknown Payee").strip()
    amount_str = params.get("am", "").strip()
    mode = params.get("mode", "").strip().lower()
    tn = params.get("tn", "").strip()

    # Parse amount
    amount: float | None = None
    if amount_str:
        try:
            amount = float(amount_str)
        except ValueError:
            amount = None

    # Determine if this is a collect request
    # mode=collect or mode=02 signals a collect/pull payment request
    is_collect_request = mode in ("collect", "02", "2")
    # collect request = someone demanding money FROM you → money leaves your account
    direction = "outgoing" if is_collect_request else "outgoing"

    # --- Check 1: Valid UPI ID format ---
    valid_format = is_valid_upi_id(upi_id) if upi_id else False
    checks.append(
        CheckResult(
            label="Valid UPI ID format",
            passed=valid_format,
            value=upi_id if upi_id else "No UPI ID found",
        )
    )

    # --- Check 2: Known UPI provider handle ---
    if upi_id and "@" in upi_id:
        handle = upi_id.split("@")[-1].lower()
        known_handle = handle in KNOWN_UPI_HANDLES
        checks.append(
            CheckResult(
                label="Known UPI provider",
                passed=known_handle,
                value=handle,
            )
        )
    else:
        checks.append(
            CheckResult(
                label="Known UPI provider",
                passed=False,
                value="No handle found",
            )
        )

    # --- Check 3: Amount pre-filled ---
    if amount is not None:
        checks.append(
            CheckResult(
                label="Amount pre-filled",
                passed=False,  # pre-filled amount is notable/caution
                value=f"₹{amount:.2f} — verify this is the correct amount",
            )
        )
    else:
        checks.append(
            CheckResult(
                label="Amount pre-filled",
                passed=True,
                value="No fixed amount — you control the payment",
            )
        )

    # --- Check 4: Collect request detected ---
    checks.append(
        CheckResult(
            label="Collect request detected",
            passed=not is_collect_request,
            value="This is a collect/pull request — do NOT approve without verifying the recipient"
            if is_collect_request
            else "Standard push payment",
        )
    )

    # --- Check 5: Known scam UPI ID ---
    scam_upi_lower = [s.lower() for s in scam_upi_ids]
    upi_id_lower = upi_id.lower() if upi_id else ""
    is_known_scam = upi_id_lower in scam_upi_lower
    checks.append(
        CheckResult(
            label="Known scam UPI ID",
            passed=not is_known_scam,
            value="This UPI ID has been reported as a scam"
            if is_known_scam
            else "Not found in scam database",
        )
    )

    # --- Check 6: Transaction note review ---
    if tn:
        suspicious_keywords = [
            "refund", "cashback", "prize", "lottery", "reward",
            "kyc", "verify", "update", "urgent", "block", "freeze",
            "tax", "fine", "penalty", "police", "court",
        ]
        tn_lower = tn.lower()
        suspicious = any(kw in tn_lower for kw in suspicious_keywords)
        checks.append(
            CheckResult(
                label="Transaction note review",
                passed=not suspicious,
                value=f"Suspicious keyword in note: '{tn}'" if suspicious else f"Note: '{tn}'",
            )
        )

    upi_info = UpiInfo(
        payee_name=payee_name,
        upi_id=upi_id or "Unknown",
        amount=amount,
        direction=direction,
        is_collect_request=is_collect_request,
    )

    return upi_info, checks
