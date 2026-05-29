import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

load_dotenv()

# ── JSON structured logging for Cloud Run ─────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "msg": "%(message)s"}',
)
logger = logging.getLogger("preqr")

# ── Local imports (after logging setup) ───────────────────────────────────────
from app.database import Base, SessionLocal, engine, get_db
from app.models import KnownScamDomain, QRFlag, ScamUpiId
from app.schemas import (
    AnalyzeDetails,
    AnalyzeRequest,
    AnalyzeResponse,
    CheckResult,
    FlagCountResponse,
    FlagRequest,
    FlagResponse,
    HealthResponse,
)
from app.analyzers.upi_analyzer import analyze_upi
from app.analyzers.url_analyzer import analyze_url
from app.analyzers.wifi_analyzer import analyze_wifi
from app.analyzers.safety_scorer import compute_safety
from app.services.flag_service import flag_qr, get_flag_count, hash_qr

DATA_DIR = Path(__file__).parent / "data"


# ── Seed helpers ──────────────────────────────────────────────────────────────

def _seed_upi_ids(db: Session) -> None:
    count = db.query(ScamUpiId).count()
    if count > 0:
        return
    path = DATA_DIR / "scam_upi_seeds.json"
    try:
        with open(path) as f:
            seeds = json.load(f)
        for item in seeds:
            db.add(ScamUpiId(
                upi_id=item["upi_id"].lower(),
                reported_count=item.get("reported_count", 1),
                added_at=datetime.utcnow(),
            ))
        db.commit()
        logger.info("Seeded %d scam UPI IDs", len(seeds))
    except Exception as exc:
        db.rollback()
        logger.error("UPI seed failed: %s", exc)


def _seed_domains(db: Session) -> None:
    count = db.query(KnownScamDomain).count()
    if count > 0:
        return
    path = DATA_DIR / "scam_domain_seeds.json"
    try:
        with open(path) as f:
            seeds = json.load(f)
        for item in seeds:
            db.add(KnownScamDomain(
                domain=item["domain"].lower(),
                category=item["category"],
                added_at=datetime.utcnow(),
            ))
        db.commit()
        logger.info("Seeded %d scam domains", len(seeds))
    except Exception as exc:
        db.rollback()
        logger.error("Domain seed failed: %s", exc)


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_upi_ids(db)
        _seed_domains(db)
    finally:
        db.close()
    logger.info("PreQR backend started")
    yield
    logger.info("PreQR backend shutting down")


# ── App & rate limiter ────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="PreQR Backend", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
cors_origin_env = os.getenv("CORS_ORIGIN", "")
if cors_origin_env and cors_origin_env not in origins:
    origins.append(cors_origin_env)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── QR type detection ─────────────────────────────────────────────────────────

def detect_qr_type(content: str) -> str:
    c = content.strip().lower()
    if c.startswith("upi://"):
        return "upi"
    if c.startswith(("http://", "https://", "www.")):
        return "url"
    if c.startswith("wifi:"):
        return "wifi"
    # Bare domain heuristic
    if "." in c and " " not in c and len(c) < 255:
        return "url"
    return "text"


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")


@app.post("/api/analyze", response_model=AnalyzeResponse)
@limiter.limit("30/minute")
async def analyze(
    request: Request,
    body: AnalyzeRequest,
    db: Session = Depends(get_db),
):
    content = body.qr_content
    qr_type = detect_qr_type(content)

    raw_checks: list[dict] = []
    upi_info = None
    url_info = None

    if qr_type == "upi":
        result = analyze_upi(content, db)
        raw_checks = result["checks"]
        upi_info = result.get("upi_info")
    elif qr_type == "url":
        result = analyze_url(content, db)
        raw_checks = result["checks"]
        url_info = result.get("url_info")
    elif qr_type == "wifi":
        result = analyze_wifi(content)
        raw_checks = result["checks"]
    else:
        raw_checks = [{
            "label": "Plain text QR",
            "passed": True,
            "value": "no threats to check",
            "severity": "info",
        }]

    # Community flags
    qr_hash = hash_qr(content)
    community_flags = get_flag_count(qr_hash, db)
    if community_flags >= 5:
        raw_checks.append({
            "label": "Community flagged",
            "passed": False,
            "value": f"{community_flags} users flagged this QR",
            "severity": "danger" if community_flags >= 10 else "warning",
        })

    safety = compute_safety(raw_checks)

    # Build verdict
    danger_checks = [c for c in raw_checks if c.get("severity") == "danger"]
    warning_checks = [c for c in raw_checks if c.get("severity") == "warning"]

    if safety == "danger" and danger_checks:
        verdict = f"Dangerous: {danger_checks[0]['label'].lower()}."
    elif safety == "caution" and warning_checks:
        verdict = f"Caution: {warning_checks[0]['label'].lower()}."
    else:
        verdict = f"This {qr_type} QR code looks safe."

    # Convert raw checks to Pydantic models
    check_models = [
        CheckResult(
            label=c["label"],
            passed=c["passed"],
            value=c.get("value"),
        )
        for c in raw_checks
    ]

    return AnalyzeResponse(
        safety=safety,
        qr_type=qr_type,
        verdict=verdict,
        details=AnalyzeDetails(
            checks=check_models,
            upi_info=upi_info,
            url_info=url_info,
            community_flags=community_flags,
        ),
    )


@app.post("/api/flag", response_model=FlagResponse)
@limiter.limit("30/minute")
async def flag(
    request: Request,
    body: FlagRequest,
    db: Session = Depends(get_db),
):
    try:
        new_count = flag_qr(body.qr_content, db)
        return FlagResponse(success=True, new_flag_count=new_count)
    except Exception as exc:
        logger.error("Flag endpoint error: %s", exc)
        raise HTTPException(status_code=500, detail="Could not record flag")


@app.get("/api/flag-count/{qr_hash}", response_model=FlagCountResponse)
async def flag_count(qr_hash: str, db: Session = Depends(get_db)):
    count = get_flag_count(qr_hash, db)
    return FlagCountResponse(qr_hash=qr_hash, flag_count=count)
