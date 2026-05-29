"""
Community flagging service.

Hashes QR content with SHA-256 and upserts into the qr_flags table.
"""

import hashlib
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import QRFlag

logger = logging.getLogger(__name__)


def hash_qr(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def flag_qr(content: str, db: Session) -> int:
    """Increment flag count for the given QR content. Return new count."""
    qr_hash = hash_qr(content)
    now = datetime.utcnow()

    try:
        row = db.query(QRFlag).filter(QRFlag.qr_hash == qr_hash).first()
        if row:
            row.flag_count += 1
            row.last_flagged_at = now
        else:
            row = QRFlag(
                qr_hash=qr_hash,
                flag_count=1,
                first_flagged_at=now,
                last_flagged_at=now,
            )
            db.add(row)
        db.commit()
        db.refresh(row)
        return row.flag_count
    except Exception as exc:
        db.rollback()
        logger.error("flag_qr failed for hash %s: %s", qr_hash, exc)
        raise


def get_flag_count(qr_hash: str, db: Session) -> int:
    """Return flag count for a given hash (0 if not found)."""
    try:
        row = db.query(QRFlag).filter(QRFlag.qr_hash == qr_hash).first()
        return row.flag_count if row else 0
    except Exception as exc:
        logger.error("get_flag_count failed for hash %s: %s", qr_hash, exc)
        return 0
