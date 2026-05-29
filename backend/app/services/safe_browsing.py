import requests
from app.config import settings


def check_safe_browsing(url: str) -> bool:
    """
    Check a URL against Google Safe Browsing API v4.
    Returns True if the URL is flagged as a threat, False otherwise.
    Returns False on any error or if API key is not set.
    """
    api_key = settings.google_safe_browsing_api_key
    if not api_key:
        return False

    endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}"
    payload = {
        "client": {
            "clientId": "trustqr",
            "clientVersion": "1.0.0",
        },
        "threatInfo": {
            "threatTypes": [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }

    try:
        response = requests.post(endpoint, json=payload, timeout=2)
        response.raise_for_status()
        data = response.json()
        # If matches key exists and has entries, the URL is flagged
        return bool(data.get("matches"))
    except Exception:
        return False
