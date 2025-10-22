"""
Google Drive integration API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.google_drive import (
    GoogleDriveAuthUrl,
    GoogleDriveCallback,
    GoogleDriveStatus,
    GoogleDriveSearchRequest,
    GoogleDriveSearchResponse,
    GoogleDriveFile,
)
from app.services.google_drive_service import GoogleDriveService

router = APIRouter()


@router.get("/auth-url", response_model=GoogleDriveAuthUrl)
def get_auth_url():
    """
    Get Google OAuth authorization URL for user to grant access

    Returns:
        Authorization URL
    """
    try:
        auth_url = GoogleDriveService.get_authorization_url()
        return GoogleDriveAuthUrl(auth_url=auth_url)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/callback")
def oauth_callback(callback: GoogleDriveCallback, db: Session = Depends(get_db)):
    """
    Handle OAuth callback and exchange code for tokens

    Args:
        callback: OAuth callback data with authorization code
        db: Database session

    Returns:
        Token information and user details
    """
    try:
        result = GoogleDriveService.exchange_code_for_token(callback.code, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")


@router.get("/status", response_model=GoogleDriveStatus)
def get_status(db: Session = Depends(get_db)):
    """
    Get Google Drive connection status

    Returns:
        Connection status and user information
    """
    status = GoogleDriveService.get_connection_status(db)
    return GoogleDriveStatus(**status)


@router.post("/disconnect")
def disconnect(db: Session = Depends(get_db)):
    """
    Disconnect Google Drive by deactivating credentials

    Returns:
        Success message
    """
    GoogleDriveService.disconnect(db)
    return {"message": "Google Drive disconnected successfully"}


@router.put("/folder")
def set_folder(
    folder_data: dict,
    db: Session = Depends(get_db)
):
    """
    Set the Google Drive folder to search within

    Args:
        folder_data: Dictionary with folder_id (can be None to search all folders)
        db: Database session

    Returns:
        Success message
    """
    try:
        GoogleDriveService.set_folder_id(db, folder_data.get("folder_id"))
        return {"message": "Folder setting updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/search", response_model=GoogleDriveSearchResponse)
def search_files(
    search_request: GoogleDriveSearchRequest, db: Session = Depends(get_db)
):
    """
    Search Google Drive for files matching the query

    Args:
        search_request: Search parameters
        db: Database session

    Returns:
        List of matching files
    """
    try:
        files = GoogleDriveService.search_files(
            db,
            query=search_request.query,
            section_type=search_request.section_type,
            max_results=search_request.max_results,
        )
        return GoogleDriveSearchResponse(files=files, total_count=len(files))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.get("/file/{file_id}/content")
def get_file_content(file_id: str, db: Session = Depends(get_db)):
    """
    Get the content of a Google Drive file

    Args:
        file_id: Google Drive file ID
        db: Database session

    Returns:
        File content
    """
    try:
        content = GoogleDriveService.get_file_content(db, file_id)
        if content is None:
            raise HTTPException(
                status_code=400, detail="File type not supported for content extraction"
            )
        return {"content": content}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving content: {str(e)}")
