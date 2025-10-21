/**
 * Content Repository API service
 */
import { apiClient } from './api';
import type {
  ContentBlock,
  Tag,
  SearchParams,
  PaginatedResponse,
  ContentVersion,
} from '../types';

export const contentService = {
  // Content Blocks
  getContentBlocks: async (params?: SearchParams) => {
    return apiClient.get<PaginatedResponse<ContentBlock>>('/api/content/blocks', {
      params,
    });
  },

  getContentBlock: async (id: number) => {
    return apiClient.get<ContentBlock>(`/api/content/blocks/${id}`);
  },

  createContentBlock: async (data: Partial<ContentBlock>) => {
    return apiClient.post<ContentBlock>('/api/content/blocks', data);
  },

  updateContentBlock: async (id: number, data: Partial<ContentBlock>) => {
    return apiClient.put<ContentBlock>(`/api/content/blocks/${id}`, data);
  },

  deleteContentBlock: async (id: number) => {
    return apiClient.delete(`/api/content/blocks/${id}`);
  },

  // Search
  searchContentBlocks: async (params: SearchParams) => {
    return apiClient.post<PaginatedResponse<ContentBlock>>('/api/search/content', params);
  },

  semanticSearch: async (query: string, filters?: Partial<SearchParams>) => {
    return apiClient.post<PaginatedResponse<ContentBlock>>('/api/search/semantic', {
      query,
      ...filters,
    });
  },

  // Tags
  getTags: async () => {
    return apiClient.get<Tag[]>('/api/content/tags');
  },

  createTag: async (data: Partial<Tag>) => {
    return apiClient.post<Tag>('/api/content/tags', data);
  },

  // Versions
  getVersions: async (blockId: number) => {
    return apiClient.get<ContentVersion[]>(`/api/content/blocks/${blockId}/versions`);
  },

  createVersion: async (blockId: number, data: { change_description?: string; created_by?: string }) => {
    return apiClient.post<ContentVersion>(`/api/content/blocks/${blockId}/versions`, data);
  },

  revertToVersion: async (blockId: number, versionId: number) => {
    return apiClient.post<ContentBlock>(`/api/content/blocks/${blockId}/versions/${versionId}/revert`);
  },

  // Import
  importWordDocument: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<{ blocks_created: number; message: string }>(
      '/api/content/import/word',
      formData,
      onProgress
    );
  },

  // Export
  exportContentBlock: async (id: number) => {
    return apiClient.get<Blob>(`/api/content/blocks/${id}/export`, {
      responseType: 'blob',
    });
  },

  // AI Content Generation
  generateContentWithAI: async (data: {
    action: 'draft' | 'improve' | 'expand';
    section_type: string;
    prompt: string;
    existing_content?: string;
  }) => {
    return apiClient.post<{ content: string; action: string; section_type: string }>(
      '/api/content/ai/generate',
      data
    );
  },
};
