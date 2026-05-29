import requests


def check_urlhaus(url: str) -> bool:
    """
    Check a URL against URLhaus threat intelligence database.
    Returns True if the URL is online (active threat), False otherwise.
    Returns False on any error.
    """
    endpoint = "https://urlhaus-api.abuse.ch/v1/url/"
    try:
        response = requests.post(
            endpoint,
            json={"url": url},
            timeout=2,
        )
        response.raise_for_status()
        data = response.json()
        # query_status will be "is_available" or "no_results" etc.
        # url_status will be "online" if the threat is active
        return data.get("url_status") == "online"
    except Exception:
        return False
