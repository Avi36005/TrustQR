import pytest
from unittest.mock import patch, MagicMock
from app.analyzers.url_analyzer import (
    analyze_url,
    is_brand_lookalike,
    count_tracking_params,
    follow_redirects,
)


class TestIsBrandLookalike:
    def test_paytm_typo(self):
        result = is_brand_lookalike("payttm.com")
        assert result == "paytm"

    def test_paytm_with_dash(self):
        result = is_brand_lookalike("paytm-kyc.com")
        assert result == "paytm"

    def test_sbi_with_dash(self):
        result = is_brand_lookalike("sbi-online.net")
        assert result == "sbi"

    def test_hdfc_with_dash(self):
        result = is_brand_lookalike("hdfc-bank.info")
        assert result == "hdfc"

    def test_legitimate_domain_not_flagged(self):
        result = is_brand_lookalike("paytm.com")
        # paytm.com itself doesn't contain the typo patterns
        assert result is None

    def test_unrelated_domain_not_flagged(self):
        result = is_brand_lookalike("example.com")
        assert result is None

    def test_phonepe_suspicious_tld(self):
        result = is_brand_lookalike("phonepe.xyz")
        assert result == "phonepe"

    def test_amazon_suspicious_tld(self):
        result = is_brand_lookalike("amazon.tk")
        assert result == "amazon"


class TestCountTrackingParams:
    def test_utm_params(self):
        url = "https://example.com?utm_source=facebook&utm_medium=social&utm_campaign=sale"
        assert count_tracking_params(url) == 3

    def test_no_tracking_params(self):
        url = "https://example.com?page=1&category=shoes"
        assert count_tracking_params(url) == 0

    def test_mixed_params(self):
        url = "https://example.com?page=1&utm_source=google&fbclid=abc123"
        assert count_tracking_params(url) == 2

    def test_fbclid_only(self):
        url = "https://example.com?fbclid=abc123def456"
        assert count_tracking_params(url) == 1

    def test_gclid(self):
        url = "https://example.com?gclid=abc&utm_source=ads&utm_medium=cpc&utm_campaign=test"
        assert count_tracking_params(url) == 4

    def test_invalid_url(self):
        result = count_tracking_params("not a url")
        assert result == 0


class TestAnalyzeUrl:
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=False)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=500)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["https://example.com"])
    def test_safe_https_url(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb):
        url_info, checks = analyze_url("https://example.com", [])

        assert url_info.https is True
        assert url_info.domain == "example.com"

        https_check = next((c for c in checks if c.label == "Uses HTTPS"), None)
        assert https_check is not None
        assert https_check.passed is True

    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=False)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=500)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["http://example.com"])
    def test_http_url_fails_https_check(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb):
        url_info, checks = analyze_url("http://example.com", [])

        assert url_info.https is False
        https_check = next((c for c in checks if c.label == "Uses HTTPS"), None)
        assert https_check is not None
        assert https_check.passed is False

    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=False)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=500)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["https://bit.ly/abc"])
    def test_url_shortener_detected(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb):
        url_info, checks = analyze_url("https://bit.ly/abc123", [])

        shortener_check = next(
            (c for c in checks if c.label == "URL shortener detected"), None
        )
        assert shortener_check is not None
        assert shortener_check.passed is False

    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=False)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=500)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["https://example.com/app.apk"])
    def test_apk_download_detected(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb):
        url_info, checks = analyze_url("https://example.com/app.apk", [])

        apk_check = next((c for c in checks if c.label == "APK download link"), None)
        assert apk_check is not None
        assert apk_check.passed is False

    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=False)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=500)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["https://sbi-online.net"])
    def test_known_scam_domain_detected(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb):
        url_info, checks = analyze_url("https://sbi-online.net", ["sbi-online.net"])

        assert url_info.on_blocklist is True
        scam_check = next(
            (c for c in checks if c.label == "Known scam domain"), None
        )
        assert scam_check is not None
        assert scam_check.passed is False

    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=True)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=500)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["https://malware.com"])
    def test_safe_browsing_flagged(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb):
        url_info, checks = analyze_url("https://malware.com", [])

        assert url_info.on_blocklist is True
        gsb_check = next(
            (c for c in checks if c.label == "Google Safe Browsing"), None
        )
        assert gsb_check is not None
        assert gsb_check.passed is False

    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=False)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=3)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["https://newdomain.com"])
    def test_very_new_domain_danger(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb):
        url_info, checks = analyze_url("https://newdomain.com", [])

        age_check = next((c for c in checks if c.label == "Domain age check"), None)
        assert age_check is not None
        assert age_check.passed is False
        assert "3 days" in age_check.value

    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=False)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=500)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["https://payttm.com"])
    def test_brand_lookalike_detected(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb):
        url_info, checks = analyze_url("https://payttm.com", [])

        lookalike_check = next(
            (c for c in checks if c.label == "Brand lookalike / typosquatting"), None
        )
        assert lookalike_check is not None
        assert lookalike_check.passed is False
