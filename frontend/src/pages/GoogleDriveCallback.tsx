/**
 * Google Drive OAuth Callback Page
 * Handles the OAuth redirect and sends the code back to the parent window
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import googleDriveService from '../services/googleDriveService';

export const GoogleDriveCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authorization...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state');

      if (error) {
        setStatus('error');
        setMessage(`Authorization failed: ${error}`);
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received');
        setTimeout(() => {
          window.close();
        }, 3000);
        return;
      }

      try {
        // Exchange code for token
        await googleDriveService.handleCallback(code, state || undefined);

        setStatus('success');
        setMessage('Successfully connected to Google Drive!');

        // Send message to parent window
        if (window.opener) {
          window.opener.postMessage(
            { type: 'google-drive-auth-success' },
            window.location.origin
          );
        }

        // Close window after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } catch (err: any) {
        console.error('Error handling OAuth callback:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to complete authorization');

        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center">
          {status === 'loading' && (
            <>
              <Loader2 className="text-blue-600 animate-spin mb-4" size={48} />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connecting to Google Drive
              </h2>
              <p className="text-gray-600 text-center">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="text-green-600 mb-4" size={48} />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Success!
              </h2>
              <p className="text-gray-600 text-center">{message}</p>
              <p className="text-sm text-gray-500 mt-2">
                This window will close automatically...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="text-red-600 mb-4" size={48} />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Connection Failed
              </h2>
              <p className="text-gray-600 text-center">{message}</p>
              <p className="text-sm text-gray-500 mt-2">
                This window will close automatically...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
