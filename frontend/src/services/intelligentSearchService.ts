/**
 * Intelligent Search Service
 * Handles AI-powered content search across Content Library and Google Drive
 */
import { apiClient } from './api';
import type {
  IntelligentSearchRequest,
  IntelligentSearchResponse,
} from '../types';

const BASE_URL = '/api/intelligent-search';

export const intelligentSearchService = {
  /**
   * Perform intelligent search
   */
  search: async (
    request: IntelligentSearchRequest
  ): Promise<IntelligentSearchResponse> => {
    return apiClient.post<IntelligentSearchResponse>(
      `${BASE_URL}/search`,
      request
    );
  },

  /**
   * Clean up and polish assembled content
   */
  cleanupContent: async (
    content: string,
    instructions?: string
  ): Promise<{ original: string; cleaned: string }> => {
    return apiClient.post<{ original: string; cleaned: string }>(
      `${BASE_URL}/cleanup`,
      { content, instructions }
    );
  },
};

export default intelligentSearchService;
