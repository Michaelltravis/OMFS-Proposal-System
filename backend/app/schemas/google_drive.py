"""
Google Drive integration schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GoogleDriveAuthUrl(BaseModel):
    """Response containing Google OAuth authorization URL"""

    auth_url: str


class GoogleDriveCallback(BaseModel):
    """Request body for OAuth callback"""

    code: str
    state: Optional[str] = None


class GoogleDriveStatus(BaseModel):
    """Google Drive connection status"""

    connected: bool
    user_email: Optional[str] = None
    expires_at: Optional[datetime] = None


class GoogleDriveFile(BaseModel):
    """Google Drive file metadata"""

    id: str
    name: str
    mime_type: str
    web_view_link: Optional[str] = None
    modified_time: Optional[datetime] = None
    size: Optional[int] = None
    thumbnail_link: Optional[str] = None
    snippet: Optional[str] = None  # Content preview/snippet


class GoogleDriveSearchRequest(BaseModel):
    """Request to search Google Drive"""

    query: str
    section_type: Optional[str] = None  # To enhance search with context
    max_results: int = 10


class GoogleDriveSearchResponse(BaseModel):
    """Response from Google Drive search"""

    files: List[GoogleDriveFile]
    total_count: int
