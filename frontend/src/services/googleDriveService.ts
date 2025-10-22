/**
 * Google Drive API Service
 * Handles authentication and file operations with Google Drive
 */
import { apiClient } from './api';
import type {
  GoogleDriveAuthUrl,
  GoogleDriveStatus,
  GoogleDriveSearchRequest,
  GoogleDriveSearchResponse,
} from '../types/index';

const BASE_URL = '/api/google-drive';

export const googleDriveService = {
  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl: async (): Promise<GoogleDriveAuthUrl> => {
    return apiClient.get<GoogleDriveAuthUrl>(`${BASE_URL}/auth-url`);
  },

  /**
   * Handle OAuth callback
   */
  handleCallback: async (code: string, state?: string): Promise<any> => {
    return apiClient.post(`${BASE_URL}/callback`, { code, state });
  },

  /**
   * Get connection status
   */
  getStatus: async (): Promise<GoogleDriveStatus> => {
    return apiClient.get<GoogleDriveStatus>(`${BASE_URL}/status`);
  },

  /**
   * Disconnect Google Drive
   */
  disconnect: async (): Promise<void> => {
    return apiClient.post(`${BASE_URL}/disconnect`, {});
  },

  /**
   * Search Google Drive for files
   */
  searchFiles: async (
    request: GoogleDriveSearchRequest
  ): Promise<GoogleDriveSearchResponse> => {
    return apiClient.post<GoogleDriveSearchResponse>(
      `${BASE_URL}/search`,
      request
    );
  },

  /**
   * Get file content
   */
  getFileContent: async (fileId: string): Promise<{ content: string }> => {
    return apiClient.get<{ content: string }>(
      `${BASE_URL}/file/${fileId}/content`
    );
  },
};

export default googleDriveService;
