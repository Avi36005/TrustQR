import json
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import engine, get_db
from app import models
from app.models import ScamUpiId, KnownScamDomain
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnalyzeDetails,
    FlagRequest,
    FlagResponse,
    FlagCountResponse,
    HealthResponse,
    CheckResult,
)
from app.analyzers.upi_analyzer import analyze_upi
from app.analyzers.url_analyzer import analyze_url
from app.analyzers.wifi_analyzer import analyze_wifi
from app.analyzers.safety_scorer import compute_safety, classify_qr_type, generate_verdict
from app.services.flag_service import flag_qr, get_flag_count, hash_qr

# Data directory path
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


def seed_database(db: Session) -> None:
    """Seed the database with known scam UPI IDs and domains from JSON files."""
    # Seed scam UPI IDs
    scam_upi_path = os.path.join(DATA_DIR, "scam_upi_seeds.json")
    if os.path.exists(scam_upi_path):
        with open(scam_upi_path, "r") as f:
            scam_upis = json.load(f)
        for entry in scam_upis:
            existing = db.query(ScamUpiId).filter(
                ScamUpiId.upi_id == entry["upi_id"]
            ).first()
            if not existing:
                db.add(
                    ScamUpiId(
                        upi_id=entry["upi_id"],
                        reported_count=entry.get("reported_count", 1),
                        added_at=datetime.utcnow(),
                    )
                )
        db.commit()

    # Seed scam domains
    scam_domain_path = os.path.join(DATA_DIR, "scam_domain_seeds.json")
    if os.path.exists(scam_domain_path):
        with open(scam_domain_path, "r") as f:
            scam_domains = json.load(f)
        for entry in scam_domains:
            existing = db.query(KnownScamDomain).filter(
                KnownScamDomain.domain == entry["domain"]
            ).first()
            if not existing:
                db.add(
                    KnownScamDomain(
                        domain=entry["domain"],
                        category=entry.get("category", "phishing"),
                        added_at=datetime.utcnow(),
                    )
                )
        db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables and seed DB on startup."""
    models.Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()
    yield


# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="TrustQR API",
    description="QR code safety scanner for the Indian market",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok")


@app.post("/api/analyze", response_model=AnalyzeResponse)
@limiter.limit("30/minute")
def analyze_qr(
    request: Request,
    body: AnalyzeRequest,
    db: Session = Depends(get_db),
):
    """
    Analyze a QR code for safety.
    Accepts the raw QR code content and returns a safety assessment.
    """
    content = body.qr_content.strip()

    if not content:
        raise HTTPException(status_code=400, detail="qr_content cannot be empty")

    qr_type = classify_qr_type(content)

    # Fetch scam data from DB for analysis
    scam_upi_ids = [row.upi_id for row in db.query(ScamUpiId).all()]
    scam_domains = [row.domain for row in db.query(KnownScamDomain).all()]

    upi_info = None
    url_info = None
    checks: list[CheckResult] = []

    if qr_type == "upi":
        upi_info, checks = analyze_upi(content, scam_upi_ids)

    elif qr_type == "url":
        url_info, checks = analyze_url(content, scam_domains)

    elif qr_type == "wifi":
        wifi_info, checks = analyze_wifi(content)
        # WiFi doesn't have a dedicated response field but checks are included

    else:
        # Plain text — basic safety check
        checks.append(
            CheckResult(
                label="Plain text QR code",
                passed=True,
                value="QR code contains plain text — no URLs or payment info detected",
            )
        )

    # Get community flag count
    qr_hash = hash_qr(content)
    community_flags = get_flag_count(db, qr_hash)

    # Add community flags as a check if flagged multiple times
    if community_flags >= 5:
        checks.append(
            CheckResult(
                label="Community reports",
                passed=False,
                value=f"Caution: This QR code has been flagged {community_flags} times by the community",
            )
        )

    safety = compute_safety(checks)
    verdict = generate_verdict(safety, qr_type, checks)

    details = AnalyzeDetails(
        checks=checks,
        upi_info=upi_info,
        url_info=url_info,
        community_flags=community_flags,
    )

    return AnalyzeResponse(
        safety=safety,
        qr_type=qr_type,
        verdict=verdict,
        details=details,
    )


@app.post("/api/flag", response_model=FlagResponse)
@limiter.limit("30/minute")
def flag_qr_code(
    request: Request,
    body: FlagRequest,
    db: Session = Depends(get_db),
):
    """Flag a QR code as suspicious or malicious."""
    content = body.qr_content.strip()

    if not content:
        raise HTTPException(status_code=400, detail="qr_content cannot be empty")

    updated = flag_qr(db, content)
    return FlagResponse(success=True, new_flag_count=updated.flag_count)


@app.get("/api/flag-count/{qr_hash}", response_model=FlagCountResponse)
@limiter.limit("30/minute")
def get_qr_flag_count(
    request: Request,
    qr_hash: str,
    db: Session = Depends(get_db),
):
    """Get the community flag count for a QR hash."""
    count = get_flag_count(db, qr_hash)
    return FlagCountResponse(qr_hash=qr_hash, flag_count=count)
