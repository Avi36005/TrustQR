import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import QRFlag


def hash_qr(content: str) -> str:
    """Generate a SHA256 hash of QR content."""
    return hashlib.sha256(content.strip().encode("utf-8")).hexdigest()


def flag_qr(db: Session, content: str) -> QRFlag:
    """
    Upsert a QRFlag record for the given QR content.
    Increments flag_count if already exists, creates new record if not.
    Returns the updated/created QRFlag record.
    """
    qr_hash = hash_qr(content)
    now = datetime.utcnow()

    existing = db.query(QRFlag).filter(QRFlag.qr_hash == qr_hash).first()
    if existing:
        existing.flag_count += 1
        existing.last_flagged_at = now
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_flag = QRFlag(
            qr_hash=qr_hash,
            flag_count=1,
            first_flagged_at=now,
            last_flagged_at=now,
        )
        db.add(new_flag)
        db.commit()
        db.refresh(new_flag)
        return new_flag


def get_flag_count(db: Session, qr_hash: str) -> int:
    """Return the flag count for a given QR hash, or 0 if not found."""
    record = db.query(QRFlag).filter(QRFlag.qr_hash == qr_hash).first()
    if record:
        return record.flag_count
    return 0
