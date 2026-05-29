from typing import Any, Optional
from pydantic import BaseModel, field_validator


# ── Requests ──────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    qr_content: str

    @field_validator("qr_content")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("qr_content must not be empty")
        return v.strip()


class FlagRequest(BaseModel):
    qr_content: str

    @field_validator("qr_content")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("qr_content must not be empty")
        return v.strip()


# ── Sub-models ─────────────────────────────────────────────────────────────────

class CheckResult(BaseModel):
    label: str
    passed: bool
    value: Optional[str] = None


class AnalyzeDetails(BaseModel):
    checks: list[CheckResult]
    upi_info: Optional[dict[str, Any]] = None
    url_info: Optional[dict[str, Any]] = None
    community_flags: int = 0


# ── Responses ─────────────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    safety: str           # safe | caution | danger
    qr_type: str          # upi | url | wifi | text
    verdict: str
    details: AnalyzeDetails


class FlagResponse(BaseModel):
    success: bool
    new_flag_count: int


class FlagCountResponse(BaseModel):
    qr_hash: str
    flag_count: int


class HealthResponse(BaseModel):
    status: str
