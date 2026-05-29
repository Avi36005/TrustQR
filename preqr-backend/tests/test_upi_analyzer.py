"""
Tests for UPI analyzer.
"""
import pytest
from unittest.mock import MagicMock

from app.analyzers.upi_analyzer import analyze_upi
from app.analyzers.safety_scorer import compute_safety


def _make_db(upi_in_db: bool = False):
    """Return a mock DB session."""
    db = MagicMock()
    query_result = MagicMock()
    query_result.first.return_value = MagicMock() if upi_in_db else None
    db.query.return_value.filter.return_value = query_result
    return db


class TestUpiAnalyzer:

    def test_valid_upi_pay_safe(self):
        """A normal UPI pay QR with a valid ID and no amount should be safe."""
        content = "upi://pay?pa=merchant@oksbi&pn=MerchantName&cu=INR"
        db = _make_db(upi_in_db=False)
        result = analyze_upi(content, db)
        safety = compute_safety(result["checks"])
        assert safety == "safe"
        assert result["upi_info"]["upi_id"] == "merchant@oksbi"
        assert result["direction"] == "outgoing"

    def test_collect_request_is_danger(self):
        """A collect-mode UPI QR must be rated danger."""
        content = "upi://pay?pa=merchant@oksbi&pn=Shop&mode=collect"
        db = _make_db(upi_in_db=False)
        result = analyze_upi(content, db)
        safety = compute_safety(result["checks"])
        assert safety == "danger"
        collect_check = next(
            (c for c in result["checks"] if "Collect" in c["label"]), None
        )
        assert collect_check is not None
        assert collect_check["passed"] is False

    def test_known_scam_upi_is_danger(self):
        """A UPI ID that is in the scam database should be danger."""
        content = "upi://pay?pa=refund.hdfc@ybl&pn=Refund&cu=INR"
        db = _make_db(upi_in_db=True)
        result = analyze_upi(content, db)
        safety = compute_safety(result["checks"])
        assert safety == "danger"
        db_check = next(
            (c for c in result["checks"] if "scam database" in c["label"]), None
        )
        assert db_check is not None
        assert db_check["passed"] is False

    def test_malformed_upi_is_danger(self):
        """A UPI ID without @ should fail format validation."""
        content = "upi://pay?pa=notaupiid&pn=Test"
        db = _make_db(upi_in_db=False)
        result = analyze_upi(content, db)
        safety = compute_safety(result["checks"])
        assert safety == "danger"
        format_check = next(
            (c for c in result["checks"] if "format" in c["label"].lower()), None
        )
        assert format_check is not None
        assert format_check["passed"] is False

    def test_prefilled_amount_is_warning(self):
        """A QR with a pre-filled amount should generate a warning check."""
        content = "upi://pay?pa=shop@okaxis&pn=Shop&am=999&cu=INR"
        db = _make_db(upi_in_db=False)
        result = analyze_upi(content, db)
        amount_check = next(
            (c for c in result["checks"] if "Amount" in c["label"]), None
        )
        assert amount_check is not None
        assert amount_check["passed"] is False
        assert amount_check["severity"] == "warning"

    def test_collect_mode_02(self):
        """mode=02 is also a collect request."""
        content = "upi://pay?pa=shop@oksbi&mode=02"
        db = _make_db(upi_in_db=False)
        result = analyze_upi(content, db)
        safety = compute_safety(result["checks"])
        assert safety == "danger"

    def test_direction_outgoing(self):
        """Normal pay request → direction outgoing."""
        content = "upi://pay?pa=vendor@paytm&pn=Vendor"
        db = _make_db(upi_in_db=False)
        result = analyze_upi(content, db)
        assert result["direction"] == "outgoing"

    def test_direction_incoming_collect(self):
        """Collect request → direction incoming."""
        content = "upi://pay?pa=vendor@paytm&pn=Vendor&mode=collect"
        db = _make_db(upi_in_db=False)
        result = analyze_upi(content, db)
        assert result["direction"] == "incoming"
