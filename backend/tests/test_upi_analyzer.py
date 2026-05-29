import pytest
from app.analyzers.upi_analyzer import analyze_upi, parse_upi_uri, is_valid_upi_id
from app.analyzers.safety_scorer import classify_qr_type, compute_safety


class TestClassifyQrType:
    def test_upi_classification(self):
        assert classify_qr_type("upi://pay?pa=merchant@ybl&pn=Test") == "upi"

    def test_upi_classification_uppercase(self):
        assert classify_qr_type("UPI://pay?pa=merchant@ybl") == "upi"

    def test_url_http_classification(self):
        assert classify_qr_type("http://example.com") == "url"

    def test_url_https_classification(self):
        assert classify_qr_type("https://example.com") == "url"

    def test_wifi_classification(self):
        assert classify_qr_type("WIFI:T:WPA;S:MyNetwork;P:password;;") == "wifi"

    def test_text_classification(self):
        assert classify_qr_type("Hello World") == "text"

    def test_empty_text_classification(self):
        assert classify_qr_type("") == "text"


class TestParseUpiUri:
    def test_basic_upi_parse(self):
        content = "upi://pay?pa=merchant@ybl&pn=TestMerchant&am=500"
        params = parse_upi_uri(content)
        assert params.get("pa") == "merchant@ybl"
        assert params.get("pn") == "TestMerchant"
        assert params.get("am") == "500"

    def test_upi_with_mode(self):
        content = "upi://pay?pa=receiver@oksbi&pn=Receiver&mode=collect"
        params = parse_upi_uri(content)
        assert params.get("mode") == "collect"

    def test_upi_minimal(self):
        content = "upi://pay?pa=someone@paytm"
        params = parse_upi_uri(content)
        assert params.get("pa") == "someone@paytm"

    def test_invalid_uri_returns_empty(self):
        params = parse_upi_uri("not a upi uri")
        assert params == {}


class TestIsValidUpiId:
    def test_valid_upi_id(self):
        assert is_valid_upi_id("merchant@ybl") is True

    def test_valid_with_dots(self):
        assert is_valid_upi_id("john.doe@okaxis") is True

    def test_valid_with_numbers(self):
        assert is_valid_upi_id("9876543210@paytm") is True

    def test_invalid_no_at_sign(self):
        assert is_valid_upi_id("merchantybl") is False

    def test_invalid_empty(self):
        assert is_valid_upi_id("") is False

    def test_invalid_double_at(self):
        assert is_valid_upi_id("merchant@@ybl") is False


class TestAnalyzeUpi:
    def test_basic_upi_analysis(self):
        content = "upi://pay?pa=merchant@ybl&pn=TestMerchant&am=500"
        upi_info, checks = analyze_upi(content, [])

        assert upi_info.upi_id == "merchant@ybl"
        assert upi_info.payee_name == "TestMerchant"
        assert upi_info.amount == 500.0
        assert upi_info.direction == "outgoing"
        assert upi_info.is_collect_request is False
        assert len(checks) > 0

    def test_collect_request_detected(self):
        content = "upi://pay?pa=scammer@ybl&pn=Scammer&mode=collect"
        upi_info, checks = analyze_upi(content, [])

        assert upi_info.is_collect_request is True
        assert upi_info.direction == "incoming"

        collect_check = next(
            (c for c in checks if c.label == "Collect request detected"), None
        )
        assert collect_check is not None
        assert collect_check.passed is False

    def test_collect_request_mode_02(self):
        content = "upi://pay?pa=scammer@ybl&pn=Scammer&mode=02"
        upi_info, checks = analyze_upi(content, [])
        assert upi_info.is_collect_request is True

    def test_known_scam_upi_flagged(self):
        content = "upi://pay?pa=scam@ybl&pn=Scammer"
        upi_info, checks = analyze_upi(content, ["scam@ybl"])

        scam_check = next(
            (c for c in checks if c.label == "Known scam UPI ID"), None
        )
        assert scam_check is not None
        assert scam_check.passed is False

    def test_clean_upi_not_flagged(self):
        content = "upi://pay?pa=legitmerchant@ybl&pn=Legit"
        upi_info, checks = analyze_upi(content, ["scam@ybl"])

        scam_check = next(
            (c for c in checks if c.label == "Known scam UPI ID"), None
        )
        assert scam_check is not None
        assert scam_check.passed is True

    def test_amount_prefilled_check(self):
        content = "upi://pay?pa=merchant@ybl&pn=Merchant&am=100"
        upi_info, checks = analyze_upi(content, [])

        amount_check = next(
            (c for c in checks if c.label == "Amount pre-filled"), None
        )
        assert amount_check is not None
        assert amount_check.passed is False  # caution when amount is pre-filled

    def test_no_amount_check_passes(self):
        content = "upi://pay?pa=merchant@ybl&pn=Merchant"
        upi_info, checks = analyze_upi(content, [])

        amount_check = next(
            (c for c in checks if c.label == "Amount pre-filled"), None
        )
        assert amount_check is not None
        assert amount_check.passed is True

    def test_suspicious_transaction_note(self):
        content = "upi://pay?pa=merchant@ybl&pn=Merchant&tn=KYC+update+required"
        upi_info, checks = analyze_upi(content, [])

        tn_check = next(
            (c for c in checks if c.label == "Transaction note review"), None
        )
        assert tn_check is not None
        assert tn_check.passed is False


class TestComputeSafety:
    def test_all_pass_is_safe(self):
        checks = [
            {"label": "Check 1", "passed": True},
            {"label": "Check 2", "passed": True},
        ]
        from app.schemas import CheckResult
        check_objs = [CheckResult(**c) for c in checks]
        assert compute_safety(check_objs) == "safe"

    def test_danger_label_failure_is_danger(self):
        from app.schemas import CheckResult
        checks = [
            CheckResult(label="Collect request detected", passed=False),
            CheckResult(label="Valid UPI ID format", passed=True),
        ]
        assert compute_safety(checks) == "danger"

    def test_two_warnings_is_caution(self):
        from app.schemas import CheckResult
        checks = [
            CheckResult(label="Amount pre-filled", passed=False),
            CheckResult(label="Uses HTTPS", passed=False),
            CheckResult(label="Valid UPI ID format", passed=True),
        ]
        assert compute_safety(checks) == "caution"

    def test_one_warning_is_safe(self):
        from app.schemas import CheckResult
        checks = [
            CheckResult(label="Amount pre-filled", passed=False),
            CheckResult(label="Valid UPI ID format", passed=True),
        ]
        assert compute_safety(checks) == "safe"
