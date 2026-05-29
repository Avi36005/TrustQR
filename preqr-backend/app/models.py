from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class QRFlag(Base):
    __tablename__ = "qr_flags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    qr_hash = Column(String, index=True, unique=True, nullable=False)
    flag_count = Column(Integer, default=0, nullable=False)
    first_flagged_at = Column(DateTime, default=datetime.utcnow)
    last_flagged_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ScamUpiId(Base):
    __tablename__ = "scam_upi_ids"

    id = Column(Integer, primary_key=True, autoincrement=True)
    upi_id = Column(String, index=True, nullable=False)
    reported_count = Column(Integer, default=1)
    added_at = Column(DateTime, default=datetime.utcnow)


class KnownScamDomain(Base):
    __tablename__ = "known_scam_domains"

    id = Column(Integer, primary_key=True, autoincrement=True)
    domain = Column(String, index=True, nullable=False)
    category = Column(String, nullable=False)  # phishing / malware / fake-brand / data-harvest
    added_at = Column(DateTime, default=datetime.utcnow)
