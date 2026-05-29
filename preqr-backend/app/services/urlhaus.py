"""
URLhaus (abuse.ch) URL lookup.

Returns:
  True  – URL is in the URLhaus database (malicious)
  False – URL is not in the database
  None  – request failed (skip)
"""

import logging
from typing import Optional
from urllib.parse import urlencode

import requests

logger = logging.getLogger(__name__)

URLHAUS_API = "https://urlhaus-api.abuse.ch/v1/url/"


def check_urlhaus(url: str) -> Optional[bool]:
    try:
        resp = requests.post(
            URLHAUS_API,
            data=urlencode({"url": url}),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=2,
        )
        resp.raise_for_status()
        data = resp.json()

        query_status = data.get("query_status", "")
        # "is_reporter" or any non-no-results status means it was found
        if query_status == "no_results":
            return False
        if query_status in ("is_reporter", "is_submitter"):
            return True
        # "ok" with a urls_count > 0 also means found
        if data.get("urls_count", 0) > 0:
            return True
        return False
    except requests.exceptions.Timeout:
        logger.warning("URLhaus timeout for %s", url)
        return None
    except Exception as exc:
        logger.warning("URLhaus error for %s: %s", url, exc)
        return None
