"""
WHOIS domain age lookup with a 2-second timeout enforced via threading.

Returns age in days, or None if the lookup fails or times out.
"""

import logging
import threading
from datetime import datetime, timezone
from typing import Optional

import whois  # python-whois

logger = logging.getLogger(__name__)


def _do_whois(domain: str, result: dict) -> None:
    try:
        w = whois.whois(domain)
        creation = w.creation_date
        if isinstance(creation, list):
            creation = creation[0]
        if creation:
            # Ensure timezone-aware comparison
            if creation.tzinfo is None:
                creation = creation.replace(tzinfo=timezone.utc)
            now = datetime.now(tz=timezone.utc)
            result["days"] = (now - creation).days
    except Exception as exc:
        logger.debug("WHOIS lookup error for %s: %s", domain, exc)


def get_domain_age_days(domain: str) -> Optional[int]:
    result: dict = {}
    t = threading.Thread(target=_do_whois, args=(domain, result), daemon=True)
    t.start()
    t.join(timeout=2.0)  # 2-second hard timeout
    return result.get("days")  # None if timed out or failed
