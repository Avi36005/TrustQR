from typing import Optional, List, Literal
from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    qr_content: str


class CheckResult(BaseModel):
    label: str
    passed: bool
    value: Optional[str] = None
    warning: Optional[bool] = False  # add this line


class UpiInfo(BaseModel):
    payee_name: str
    upi_id: str
    amount: Optional[float] = None
    direction: Literal["outgoing", "incoming"]
    is_collect_request: bool


class UrlInfo(BaseModel):
    domain: str
    domain_age_days: Optional[int] = None
    https: bool
    redirect_chain: List[str]
    trackers_count: int
    on_blocklist: bool


class AnalyzeDetails(BaseModel):
    checks: List[CheckResult]
    upi_info: Optional[UpiInfo] = None
    url_info: Optional[UrlInfo] = None
    community_flags: int


class AnalyzeResponse(BaseModel):
    safety: Literal["safe", "caution", "danger"]
    qr_type: Literal["upi", "url", "wifi", "text"]
    verdict: str
    details: AnalyzeDetails


class FlagRequest(BaseModel):
    qr_content: str


class FlagResponse(BaseModel):
    success: bool
    new_flag_count: int


class FlagCountResponse(BaseModel):
    qr_hash: str
    flag_count: int


class HealthResponse(BaseModel):
    status: str


class StatsResponse(BaseModel):
    total_scans: int
    total_flags: int


class WarningItem(BaseModel):
    display_name: str
    warning_message: str
    received_via: str
    city: Optional[str] = None
    time_ago: str


class QRPreviewData(BaseModel):
    payee_name: Optional[str] = None
    upi_id: Optional[str] = None
    amount: Optional[str] = None
    is_collect: bool = False
    domain: Optional[str] = None
    raw_preview: str


class CommunityFeedItem(BaseModel):
    qr_hash: str
    qr_type: str
    qr_preview: QRPreviewData
    flag_count: int
    first_flagged_at: str
    last_flagged_at: str
    time_ago: str
    warnings: List[WarningItem]


class CommunityFeedResponse(BaseModel):
    total: int
    items: List[CommunityFeedItem]
