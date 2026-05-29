"""
Integration tests for FastAPI endpoints.
Uses TestClient with an in-memory SQLite database.
"""
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

# ── In-memory test DB ─────────────────────────────────────────────────────────

TEST_DB_URL = "sqlite://"  # in-memory

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=True)


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_ok(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestAnalyze:

    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=None)
    @patch("app.analyzers.url_analyzer._follow_redirects",
           return_value=("https://example.com/", ["https://example.com/"]))
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=None)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    def test_analyze_valid_url(self, _uh, _sb, _redir, _whois, client):
        resp = client.post("/api/analyze", json={"qr_content": "https://example.com/"})
        assert resp.status_code == 200
        data = resp.json()
        assert "safety" in data
        assert "qr_type" in data
        assert "verdict" in data
        assert "details" in data
        assert data["qr_type"] == "url"
        assert "checks" in data["details"]
        assert isinstance(data["details"]["checks"], list)

    def test_analyze_valid_upi(self, client):
        resp = client.post(
            "/api/analyze",
            json={"qr_content": "upi://pay?pa=merchant@oksbi&pn=Shop&cu=INR"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["qr_type"] == "upi"
        assert data["safety"] in ("safe", "caution", "danger")
        assert data["details"]["upi_info"] is not None

    def test_analyze_invalid_body_empty_string(self, client):
        resp = client.post("/api/analyze", json={"qr_content": "   "})
        assert resp.status_code == 422  # Pydantic validation error

    def test_analyze_missing_field(self, client):
        resp = client.post("/api/analyze", json={})
        assert resp.status_code == 422

    def test_analyze_wifi_qr(self, client):
        resp = client.post(
            "/api/analyze",
            json={"qr_content": "WIFI:T:WPA;S:HomeNetwork;P:password123;;"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["qr_type"] == "wifi"

    def test_analyze_plain_text(self, client):
        resp = client.post(
            "/api/analyze",
            json={"qr_content": "Hello, this is plain text"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["qr_type"] == "text"
        assert data["safety"] == "safe"


class TestFlag:

    def test_flag_increments_count(self, client):
        content = "upi://pay?pa=test@oksbi"
        resp1 = client.post("/api/flag", json={"qr_content": content})
        assert resp1.status_code == 200
        assert resp1.json()["success"] is True
        assert resp1.json()["new_flag_count"] == 1

        resp2 = client.post("/api/flag", json={"qr_content": content})
        assert resp2.status_code == 200
        assert resp2.json()["new_flag_count"] == 2

    def test_flag_count_endpoint(self, client):
        from app.services.flag_service import hash_qr
        content = "https://example.com/"
        # Flag it once first
        client.post("/api/flag", json={"qr_content": content})
        qr_hash = hash_qr(content)
        resp = client.get(f"/api/flag-count/{qr_hash}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["qr_hash"] == qr_hash
        assert data["flag_count"] == 1

    def test_flag_count_zero_for_unknown(self, client):
        resp = client.get("/api/flag-count/deadbeef" * 8)
        assert resp.status_code == 200
        assert resp.json()["flag_count"] == 0

    def test_flag_invalid_body(self, client):
        resp = client.post("/api/flag", json={"qr_content": ""})
        assert resp.status_code == 422
