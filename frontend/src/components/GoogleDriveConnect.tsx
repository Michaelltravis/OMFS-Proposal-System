/**
 * Google Drive Connection Component
 * Handles Google Drive authentication and displays connection status
 */
import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, LogOut, Loader2 } from 'lucide-react';
import { googleDriveService } from '../services/googleDriveService';
import type { GoogleDriveStatus } from '../types';

interface GoogleDriveConnectProps {
  onStatusChange?: (connected: boolean) => void;
}

export const GoogleDriveConnect: React.FC<GoogleDriveConnectProps> = ({
  onStatusChange,
}) => {
  const [status, setStatus] = useState<GoogleDriveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [folderInput, setFolderInput] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const statusData = await googleDriveService.getStatus();
      setStatus(statusData);
      onStatusChange?.(statusData.connected);
    } catch (error) {
      console.error('Error checking Google Drive status:', error);
      setStatus({ connected: false });
      onStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { auth_url } = await googleDriveService.getAuthUrl();
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        auth_url,
        'Google Drive Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'google-drive-auth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          await checkStatus();
          setConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed without completing auth
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setConnecting(false);
        }
      }, 1000);
    } catch (error) {
      console.error('Error connecting to Google Drive:', error);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive?')) {
      return;
    }

    try {
      setLoading(true);
      await googleDriveService.disconnect();
      await checkStatus();
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractFolderId = (input: string): string | null => {
    if (!input) return null;

    // If it's a URL, extract the folder ID
    const urlMatch = input.match(/folders\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Otherwise assume it's already a folder ID
    return input.trim() || null;
  };

  const handleSaveFolder = async () => {
    try {
      setSavingFolder(true);
      const folderId = extractFolderId(folderInput);
      await googleDriveService.setFolder(folderId);
      await checkStatus();
      setFolderInput('');
      alert('Folder setting saved! All searches will now be limited to this folder.');
    } catch (error) {
      console.error('Error saving folder:', error);
      alert('Failed to save folder setting');
    } finally {
      setSavingFolder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="animate-spin" size={16} />
        <span className="text-sm">Checking connection...</span>
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-green-600">
            <Cloud size={20} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Connected to Google Drive</span>
              {status.user_email && (
                <span className="text-xs text-gray-500">{status.user_email}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Disconnect"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Folder Setting */}
        <div className="flex flex-col gap-1 text-xs">
          {status.folder_id ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">
                Searching in folder: <span className="font-mono bg-gray-100 px-1 rounded">{status.folder_id}</span>
              </span>
              <button
                onClick={() => {
                  if (confirm('Remove folder restriction and search all folders?')) {
                    googleDriveService.setFolder(null).then(() => checkStatus());
                  }
                }}
                className="text-red-600 hover:underline"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="Paste folder URL or ID to limit searches..."
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
              <button
                onClick={handleSaveFolder}
                disabled={!folderInput || savingFolder}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {savingFolder ? 'Saving...' : 'Set Folder'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {connecting ? (
        <>
          <Loader2 className="animate-spin" size={16} />
          <span className="text-sm">Connecting...</span>
        </>
      ) : (
        <>
          <CloudOff size={16} />
          <span className="text-sm">Connect Google Drive</span>
        </>
      )}
    </button>
  );
};
