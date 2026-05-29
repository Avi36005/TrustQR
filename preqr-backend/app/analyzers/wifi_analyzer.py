"""
WiFi QR analyzer.

Parses the standard WiFi QR format:
  WIFI:T:WPA;S:NetworkName;P:password;H:false;;
"""

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Well-known / suspicious SSID patterns
SUSPICIOUS_SSID_PATTERNS = [
    re.compile(r"free.*wifi", re.IGNORECASE),
    re.compile(r"public.*wifi", re.IGNORECASE),
    re.compile(r"bank.*wifi", re.IGNORECASE),
    re.compile(r"atm.*wifi", re.IGNORECASE),
]


def _parse_wifi(content: str) -> dict[str, str]:
    """Extract fields from WIFI:... string."""
    result: dict[str, str] = {}
    # Strip leading WIFI: prefix
    body = re.sub(r"^WIFI:", "", content, flags=re.IGNORECASE).rstrip(";")

    # Fields are KEY:VALUE pairs separated by ";"
    # Values can contain escaped semicolons (\;)
    pattern = re.compile(r"([TSPH]):(.+?)(?<!\\);")
    for m in pattern.finditer(body + ";"):
        result[m.group(1).upper()] = m.group(2).replace("\\;", ";")
    return result


def analyze_wifi(content: str) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []

    fields = _parse_wifi(content)

    ssid = fields.get("S", "")
    password = fields.get("P", "")
    security = fields.get("T", "").upper()  # WPA / WEP / nopass
    hidden = fields.get("H", "false").lower() == "true"

    # 1. No encryption
    no_encryption = security in ("NOPASS", "")
    checks.append({
        "label": "Network has no encryption",
        "passed": not no_encryption,
        "value": "open network – no password" if no_encryption else security,
        "severity": "warning" if no_encryption else "info",
    })

    # 2. WEP is insecure
    is_wep = security == "WEP"
    checks.append({
        "label": "WEP encryption (outdated)",
        "passed": not is_wep,
        "value": "WEP is easily cracked" if is_wep else "no",
        "severity": "warning" if is_wep else "info",
    })

    # 3. Suspicious SSID
    suspicious = any(p.search(ssid) for p in SUSPICIOUS_SSID_PATTERNS)
    checks.append({
        "label": "Suspicious network name",
        "passed": not suspicious,
        "value": ssid if suspicious else "ok",
        "severity": "warning" if suspicious else "info",
    })

    # 4. Empty SSID
    empty_ssid = not ssid.strip()
    checks.append({
        "label": "Network name (SSID) present",
        "passed": not empty_ssid,
        "value": ssid if not empty_ssid else "missing",
        "severity": "warning" if empty_ssid else "info",
    })

    wifi_info = {
        "ssid": ssid,
        "security": security or "OPEN",
        "hidden": hidden,
        "has_password": bool(password),
    }

    return {
        "checks": checks,
        "wifi_info": wifi_info,
    }
