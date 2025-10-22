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
