from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def run_migrations():
    """Add new columns to existing tables that predate the model changes."""
    with engine.connect() as conn:
        for col, col_type in [("qr_type", "VARCHAR"), ("qr_preview_data", "TEXT")]:
            try:
                conn.execute(__import__("sqlalchemy").text(
                    f"ALTER TABLE qr_flags ADD COLUMN {col} {col_type}"
                ))
                conn.commit()
            except Exception:
                pass  # column already exists


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
