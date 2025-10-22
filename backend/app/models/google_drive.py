"""
Google Drive integration models
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class GoogleDriveCredential(Base):
    """
    Stores Google Drive OAuth credentials for users
    Currently storing as a single credential (can be extended for multi-user)
    """

    __tablename__ = "google_drive_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=True)  # For future multi-user support
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    token_uri = Column(String, nullable=True)
    client_id = Column(String, nullable=True)
    client_secret = Column(String, nullable=True)
    scopes = Column(Text, nullable=True)  # JSON string of scopes
    expiry = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<GoogleDriveCredential(id={self.id}, user_id={self.user_id}, is_active={self.is_active})>"
