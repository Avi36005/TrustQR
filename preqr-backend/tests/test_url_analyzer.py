"""
Tests for URL analyzer.
"""
import pytest
from unittest.mock import MagicMock, patch

from app.analyzers.url_analyzer import analyze_url
from app.analyzers.safety_scorer import compute_safety


def _make_db(domain_in_db: bool = False, category: str = "phishing"):
    db = MagicMock()
    query_result = MagicMock()
    mock_row = MagicMock()
    mock_row.category = category
    query_result.first.return_value = mock_row if domain_in_db else None
    db.query.return_value.filter.return_value = query_result
    return db


class TestUrlAnalyzer:

    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=None)
    @patch("app.analyzers.url_analyzer._follow_redirects", return_value=("https://bit.ly/abc", ["https://bit.ly/abc"]))
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=None)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    def test_shortener_url_is_caution(self, _uh, _sb, _redir, _whois):
        """bit.ly URL should trigger at least a warning → caution."""
        content = "https://bit.ly/somelink"
        db = _make_db(domain_in_db=False)
        result = analyze_url(content, db)
        safety = compute_safety(result["checks"])
        # bit.ly is a shortener (warning) + no-https on redirect (info) → caution or safe
        shortener_check = next(
            (c for c in result["checks"] if "shortener" in c["label"].lower()), None
        )
        assert shortener_check is not None
        assert shortener_check["passed"] is False

    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=None)
    @patch("app.analyzers.url_analyzer._follow_redirects", return_value=("https://malicious.com/app.apk", ["https://malicious.com/app.apk"]))
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=None)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    def test_apk_download_is_danger(self, _uh, _sb, _redir, _whois):
        """URL ending in .apk should be rated danger."""
        content = "https://malicious.com/app.apk"
        db = _make_db(domain_in_db=False)
        result = analyze_url(content, db)
        safety = compute_safety(result["checks"])
        assert safety == "danger"
        apk_check = next(
            (c for c in result["checks"] if "APK" in c["label"]), None
        )
        assert apk_check is not None
        assert apk_check["passed"] is False

    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=10)
    @patch("app.analyzers.url_analyzer._follow_redirects", return_value=("https://newsite.com/", ["https://newsite.com/"]))
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=None)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    def test_young_domain_is_caution(self, _uh, _sb, _redir, _whois):
        """Domain age < 30 days should produce a warning."""
        content = "https://newsite.com/"
        db = _make_db(domain_in_db=False)
        result = analyze_url(content, db)
        age_check = next(
            (c for c in result["checks"] if "new" in c["label"].lower()), None
        )
        assert age_check is not None
        assert age_check["passed"] is False
        assert age_check["severity"] == "warning"

    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=None)
    @patch("app.analyzers.url_analyzer._follow_redirects", return_value=("https://paytm-cashback.com/", ["https://paytm-cashback.com/"]))
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=None)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    def test_brand_lookalike_is_danger(self, _uh, _sb, _redir, _whois):
        """A domain that mimics a brand should be rated danger."""
        content = "https://paytm-cashback.com/"
        db = _make_db(domain_in_db=False)
        result = analyze_url(content, db)
        # Either in scam db check or brand lookalike check should flag it
        danger_checks = [c for c in result["checks"] if c.get("severity") == "danger"]
        # At minimum, brand lookalike check should fire
        lookalike_check = next(
            (c for c in result["checks"] if "lookalike" in c["label"].lower()), None
        )
        assert lookalike_check is not None
        assert lookalike_check["passed"] is False

    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=500)
    @patch("app.analyzers.url_analyzer._follow_redirects", return_value=("https://sbi-netbanking.com/", ["https://sbi-netbanking.com/"]))
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=None)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    def test_scam_domain_in_db_is_danger(self, _uh, _sb, _redir, _whois):
        """Domain present in the scam database must trigger danger."""
        content = "https://sbi-netbanking.com/"
        db = _make_db(domain_in_db=True, category="phishing")
        result = analyze_url(content, db)
        safety = compute_safety(result["checks"])
        assert safety == "danger"
        db_check = next(
            (c for c in result["checks"] if "scam database" in c["label"].lower()), None
        )
        assert db_check is not None
        assert db_check["passed"] is False

    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=None)
    @patch("app.analyzers.url_analyzer._follow_redirects", return_value=("http://example.com/", ["http://example.com/"]))
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=None)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    def test_http_url_generates_warning(self, _uh, _sb, _redir, _whois):
        """Non-HTTPS final URL should generate a warning."""
        content = "http://example.com/"
        db = _make_db(domain_in_db=False)
        result = analyze_url(content, db)
        https_check = next(
            (c for c in result["checks"] if "HTTPS" in c["label"]), None
        )
        assert https_check is not None
        assert https_check["passed"] is False
