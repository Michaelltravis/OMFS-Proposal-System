# Google Drive Integration Setup Guide

This guide explains how to set up the Google Drive integration for the OMFS Proposal System.

## Overview

The Google Drive integration allows you to:
- Connect your Google Drive account to the proposal builder
- Search for relevant content from your Google Drive based on the section you're working on
- Access suggested documents directly from the proposal editor
- Insert references to Google Drive files into your proposals

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to create OAuth 2.0 credentials in GCP Console

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" and then "New Project"
3. Enter a project name (e.g., "OMFS Proposal System")
4. Click "Create"

### Step 2: Enable the Google Drive API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API" and click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (or "Internal" if using Google Workspace)
   - Fill in the required fields:
     - App name: "OMFS Proposal System"
     - User support email: Your email
     - Developer contact email: Your email
   - Click "Save and Continue"
   - Add scopes (optional for now)
   - Add test users if using External (add your email)
   - Click "Save and Continue"

4. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: "OMFS Proposal Builder"
   - Authorized JavaScript origins: `http://localhost:5173` (add your frontend URL)
   - Authorized redirect URIs: `http://localhost:5173/google-drive/callback`
   - Click "Create"

5. Copy the Client ID and Client Secret shown in the dialog

### Step 4: Configure Backend Environment Variables

1. Navigate to the backend directory: `cd backend`
2. Create or update your `.env` file with the following variables:

```env
# Google Drive Integration
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/google-drive/callback
```

Replace `your_client_id_here` and `your_client_secret_here` with the values from Step 3.

### Step 5: Run Database Migration

The Google Drive integration requires a new database table. Run the migration:

```bash
cd backend
alembic upgrade head
```

### Step 6: Install Dependencies

Make sure all required Python packages are installed:

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `google-auth`
- `google-auth-oauthlib`
- `google-auth-httplib2`
- `google-api-python-client`

### Step 7: Restart the Application

Restart both the backend and frontend servers:

```bash
# Backend
cd backend
uvicorn app.main:app --reload

# Frontend (in a new terminal)
cd frontend
npm run dev
```

## Using the Google Drive Integration

### Connecting Google Drive

1. Open a proposal and click "Add Content" on any section
2. In the section content modal, you'll see a "Connect Google Drive" button in the header
3. Click the button to open the Google OAuth authorization window
4. Sign in with your Google account and grant the requested permissions
5. Once connected, the status will show "Connected to Google Drive"

### Finding Relevant Content

1. When editing a section, the Google Drive Suggestions panel will appear on the right side
2. The system automatically searches for files related to your section title
3. You can enter custom search terms and click "Search" to find specific content
4. Click on any file to insert a reference link to that file in your content
5. Click the external link icon to open the file in Google Drive

### Managing Connection

- To disconnect Google Drive, click the logout icon next to the connection status
- You can toggle the suggestions panel on/off using the panel icon in the modal header

## Troubleshooting

### "Google OAuth credentials not configured" Error

- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in your `.env` file
- Restart the backend server after adding the credentials

### "Failed to search Google Drive" Error

- Ensure you're connected to Google Drive (check the connection status)
- Verify that the Google Drive API is enabled in your GCP project
- Check that your OAuth token hasn't expired (disconnect and reconnect if needed)

### OAuth Callback Not Working

- Verify the redirect URI in your GCP console matches: `http://localhost:5173/google-drive/callback`
- Make sure the frontend is running on port 5173
- Check browser console for any error messages

### No Files Found

- Try different search terms
- Make sure you have documents in your Google Drive
- The search looks for: Google Docs, PDFs, Word documents, and presentations

## Security Notes

- The system stores OAuth tokens securely in the database
- Only read-only access to your Google Drive is requested
- Tokens are refreshed automatically when they expire
- You can revoke access at any time from your Google Account settings

## API Scopes Requested

The integration requests the following minimal scopes:
- `https://www.googleapis.com/auth/drive.readonly` - Read-only access to view files
- `https://www.googleapis.com/auth/drive.metadata.readonly` - Read file metadata

## Support

For issues or questions, please contact the development team or create an issue in the project repository.
