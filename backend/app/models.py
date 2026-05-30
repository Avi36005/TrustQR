from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class QRFlag(Base):
    __tablename__ = "qr_flags"

    id = Column(Integer, primary_key=True, index=True)
    qr_hash = Column(String, unique=True, nullable=False, index=True)
    flag_count = Column(Integer, default=1, nullable=False)
    first_flagged_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_flagged_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    qr_type = Column(String, nullable=True)           # "upi", "url", "wifi", "text"
    qr_preview_data = Column(String, nullable=True)   # JSON string of decoded preview


class ScamUpiId(Base):
    __tablename__ = "scam_upi_ids"

    id = Column(Integer, primary_key=True, index=True)
    upi_id = Column(String, unique=True, nullable=False, index=True)
    reported_count = Column(Integer, default=1, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class KnownScamDomain(Base):
    __tablename__ = "known_scam_domains"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, unique=True, nullable=False, index=True)
    category = Column(String, nullable=False, default="phishing")
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AppStats(Base):
    __tablename__ = "app_stats"
    key = Column(String, primary_key=True, index=True)
    value = Column(Integer, default=0)
