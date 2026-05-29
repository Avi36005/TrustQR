from datetime import datetime, timezone
from typing import Optional
import whois


def get_domain_age_days(domain: str) -> Optional[int]:
    """
    Get the age of a domain in days using WHOIS lookup.
    Returns the number of days since creation, or None on any error.
    """
    try:
        w = whois.whois(domain)
        creation_date = w.creation_date

        if creation_date is None:
            return None

        # creation_date can be a list or a single datetime
        if isinstance(creation_date, list):
            creation_date = creation_date[0]

        # Ensure it's a datetime object
        if not isinstance(creation_date, datetime):
            return None

        # Make timezone-aware if needed
        if creation_date.tzinfo is None:
            creation_date = creation_date.replace(tzinfo=timezone.utc)

        now = datetime.now(tz=timezone.utc)
        age = (now - creation_date).days
        return max(age, 0)
    except Exception:
        return None
