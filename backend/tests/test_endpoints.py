import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base


# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///./test_trustqr.db"
test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    """Create a test client with an in-memory database."""
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestAnalyzeEndpoint:
    @patch("app.analyzers.url_analyzer.check_safe_browsing", return_value=False)
    @patch("app.analyzers.url_analyzer.check_urlhaus", return_value=False)
    @patch("app.analyzers.url_analyzer.get_domain_age_days", return_value=1000)
    @patch("app.analyzers.url_analyzer.follow_redirects", return_value=["https://google.com"])
    def test_analyze_url(self, mock_redirects, mock_age, mock_urlhaus, mock_gsb, client):
        response = client.post(
            "/api/analyze",
            json={"qr_content": "https://google.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["qr_type"] == "url"
        assert data["safety"] in ("safe", "caution", "danger")
        assert "verdict" in data
        assert "details" in data
        assert "checks" in data["details"]

    def test_analyze_upi_basic(self, client):
        response = client.post(
            "/api/analyze",
            json={"qr_content": "upi://pay?pa=merchant@ybl&pn=TestMerchant&am=500"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["qr_type"] == "upi"
        assert data["details"]["upi_info"] is not None
        assert data["details"]["upi_info"]["upi_id"] == "merchant@ybl"
        assert data["details"]["upi_info"]["payee_name"] == "TestMerchant"
        assert data["details"]["upi_info"]["amount"] == 500.0

    def test_analyze_upi_collect_request(self, client):
        response = client.post(
            "/api/analyze",
            json={"qr_content": "upi://pay?pa=scammer@ybl&pn=Scammer&mode=collect"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["qr_type"] == "upi"
        assert data["safety"] == "danger"
        assert data["details"]["upi_info"]["is_collect_request"] is True

    def test_analyze_wifi(self, client):
        response = client.post(
            "/api/analyze",
            json={"qr_content": "WIFI:T:WPA;S:HomeNetwork;P:mypassword;;"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["qr_type"] == "wifi"
        assert len(data["details"]["checks"]) > 0

    def test_analyze_plain_text(self, client):
        response = client.post(
            "/api/analyze",
            json={"qr_content": "Hello, World!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["qr_type"] == "text"

    def test_analyze_empty_content_returns_400(self, client):
        response = client.post(
            "/api/analyze",
            json={"qr_content": ""},
        )
        assert response.status_code == 400

    def test_analyze_response_structure(self, client):
        response = client.post(
            "/api/analyze",
            json={"qr_content": "upi://pay?pa=test@ybl&pn=Test"},
        )
        assert response.status_code == 200
        data = response.json()

        # Validate top-level structure
        assert "safety" in data
        assert "qr_type" in data
        assert "verdict" in data
        assert "details" in data

        # Validate details structure
        details = data["details"]
        assert "checks" in details
        assert "community_flags" in details

        # Validate safety values
        assert data["safety"] in ("safe", "caution", "danger")
        assert data["qr_type"] in ("upi", "url", "wifi", "text")


class TestFlagEndpoint:
    def test_flag_qr_code(self, client):
        response = client.post(
            "/api/flag",
            json={"qr_content": "upi://pay?pa=scammer@ybl&pn=Scammer"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["new_flag_count"] >= 1

    def test_flag_same_qr_increments_count(self, client):
        content = "upi://pay?pa=flagtest@ybl&pn=FlagTest"

        # Flag once
        r1 = client.post("/api/flag", json={"qr_content": content})
        count1 = r1.json()["new_flag_count"]

        # Flag again
        r2 = client.post("/api/flag", json={"qr_content": content})
        count2 = r2.json()["new_flag_count"]

        assert count2 == count1 + 1

    def test_flag_empty_content_returns_400(self, client):
        response = client.post("/api/flag", json={"qr_content": ""})
        assert response.status_code == 400


class TestFlagCountEndpoint:
    def test_get_flag_count_for_new_hash(self, client):
        import hashlib
        qr_hash = hashlib.sha256("brand-new-content-xyz".encode()).hexdigest()
        response = client.get(f"/api/flag-count/{qr_hash}")
        assert response.status_code == 200
        data = response.json()
        assert data["qr_hash"] == qr_hash
        assert data["flag_count"] == 0

    def test_get_flag_count_after_flagging(self, client):
        import hashlib
        content = "upi://pay?pa=counttest@ybl&pn=CountTest"
        qr_hash = hashlib.sha256(content.encode()).hexdigest()

        # Flag the QR
        client.post("/api/flag", json={"qr_content": content})

        # Check count
        response = client.get(f"/api/flag-count/{qr_hash}")
        assert response.status_code == 200
        data = response.json()
        assert data["flag_count"] >= 1
