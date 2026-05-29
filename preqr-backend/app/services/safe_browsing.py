"""
Google Safe Browsing API v4 lookup.

Returns:
  True  – URL is flagged as a threat
  False – URL is clean
  None  – API key not set or request failed (skip)
"""

import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)

SAFE_BROWSING_URL = (
    "https://safebrowsing.googleapis.com/v4/threatMatches:find"
)

THREAT_TYPES = [
    "MALWARE",
    "SOCIAL_ENGINEERING",
    "UNWANTED_SOFTWARE",
    "POTENTIALLY_HARMFUL_APPLICATION",
]


def check_safe_browsing(url: str) -> Optional[bool]:
    api_key = os.getenv("GOOGLE_SAFE_BROWSING_API_KEY", "")
    if not api_key:
        return None  # skip – no key configured

    payload = {
        "client": {"clientId": "preqr-backend", "clientVersion": "1.0.0"},
        "threatInfo": {
            "threatTypes": THREAT_TYPES,
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }

    try:
        resp = requests.post(
            SAFE_BROWSING_URL,
            params={"key": api_key},
            json=payload,
            timeout=2,
        )
        resp.raise_for_status()
        data = resp.json()
        # Non-empty "matches" key means threat found
        return bool(data.get("matches"))
    except requests.exceptions.Timeout:
        logger.warning("Safe Browsing timeout for %s", url)
        return None
    except Exception as exc:
        logger.warning("Safe Browsing error for %s: %s", url, exc)
        return None
