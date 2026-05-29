import re
from typing import List, Tuple, Optional
from app.schemas import CheckResult


class WifiInfo:
    def __init__(
        self,
        ssid: str,
        security_type: str,
        password: Optional[str],
        hidden: bool,
    ):
        self.ssid = ssid
        self.security_type = security_type
        self.password = password
        self.hidden = hidden


def parse_wifi_qr(content: str) -> dict:
    """
    Parse a WIFI QR code string.
    Format: WIFI:T:<security>;S:<ssid>;P:<password>;H:<hidden>;;
    """
    result = {
        "security_type": "nopass",
        "ssid": "",
        "password": "",
        "hidden": False,
    }

    content = content.strip()
    if not content.upper().startswith("WIFI:"):
        return result

    # Remove the WIFI: prefix
    content = content[5:]

    # Parse key-value pairs separated by semicolons
    # Values can contain escaped semicolons (\;) and backslashes (\\)
    pattern = r'([TSPH]):([^;]*(?:\\;[^;]*)*)'
    matches = re.findall(pattern, content, re.IGNORECASE)

    for key, value in matches:
        # Unescape special characters
        value = value.replace("\\;", ";").replace("\\\\", "\\")
        key_upper = key.upper()

        if key_upper == "T":
            result["security_type"] = value.upper() if value else "nopass"
        elif key_upper == "S":
            result["ssid"] = value
        elif key_upper == "P":
            result["password"] = value
        elif key_upper == "H":
            result["hidden"] = value.lower() == "true"

    return result


def analyze_wifi(content: str) -> Tuple[WifiInfo, List[CheckResult]]:
    """
    Analyze a WIFI QR code content.
    Returns a tuple of (WifiInfo, list of CheckResult items).
    """
    checks: List[CheckResult] = []
    params = parse_wifi_qr(content)

    ssid = params.get("ssid", "Unknown Network")
    security_type = params.get("security_type", "NOPASS")
    password = params.get("password", "") or None
    hidden = params.get("hidden", False)

    # --- Check 1: Network security type ---
    security_upper = security_type.upper()
    if security_upper in ("WPA", "WPA2", "WPA3"):
        checks.append(
            CheckResult(
                label="Network security type",
                passed=True,
                value=f"{security_upper} — Modern encryption",
            )
        )
    elif security_upper == "WEP":
        checks.append(
            CheckResult(
                label="Network security type",
                passed=False,
                value="WEP — Outdated and insecure encryption, easily cracked",
            )
        )
    else:
        checks.append(
            CheckResult(
                label="Network security type",
                passed=False,
                value="Open network — No encryption, all traffic visible",
            )
        )

    # --- Check 2: Open network warning ---
    is_open = security_upper in ("NOPASS", "")
    checks.append(
        CheckResult(
            label="Open network check",
            passed=not is_open,
            value="Caution: This is an open/public network — avoid banking or sensitive activity"
            if is_open
            else "Network requires a password",
        )
    )

    # --- Check 3: Unknown network warning ---
    checks.append(
        CheckResult(
            label="Unknown network warning",
            passed=False,  # Always flag as caution for unknown networks from QR
            value=f"Caution: Only connect to '{ssid}' if you trust the source of this QR code",
        )
    )

    # --- Check 4: Hidden network ---
    if hidden:
        checks.append(
            CheckResult(
                label="Hidden network",
                passed=False,
                value="Caution: This is a hidden network — verify before connecting",
            )
        )
    else:
        checks.append(
            CheckResult(
                label="Hidden network",
                passed=True,
                value="Network broadcasts its SSID",
            )
        )

    # --- Check 5: Password exposed in QR ---
    if password:
        checks.append(
            CheckResult(
                label="Password in QR code",
                passed=False,
                value="Caution: Network password is embedded in this QR code — anyone who scans it gets access",
            )
        )

    wifi_info = WifiInfo(
        ssid=ssid,
        security_type=security_type,
        password=password,
        hidden=hidden,
    )

    return wifi_info, checks
