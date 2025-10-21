/**
 * Proposal Builder API service
 */
import { apiClient } from './api';
import type {
  Proposal,
  ProposalSection,
  ProposalContent,
  RFPRequirement,
  ProposalDocument,
  ProposalNote,
  PaginatedResponse,
} from '../types';

export const proposalService = {
  // Proposals
  getProposals: async (params?: { archived?: boolean; status?: string }) => {
    return apiClient.get<PaginatedResponse<Proposal>>('/api/proposals', { params });
  },

  getProposal: async (id: number) => {
    return apiClient.get<Proposal>(`/api/proposals/${id}`);
  },

  createProposal: async (data: Partial<Proposal>) => {
    return apiClient.post<Proposal>('/api/proposals', data);
  },

  updateProposal: async (id: number, data: Partial<Proposal>) => {
    return apiClient.put<Proposal>(`/api/proposals/${id}`, data);
  },

  deleteProposal: async (id: number) => {
    return apiClient.delete(`/api/proposals/${id}`);
  },

  archiveProposal: async (id: number) => {
    return apiClient.post<Proposal>(`/api/proposals/${id}/archive`);
  },

  // Sections
  getSections: async (proposalId: number) => {
    return apiClient.get<ProposalSection[]>(`/api/proposals/${proposalId}/sections`);
  },

  createSection: async (proposalId: number, data: Partial<ProposalSection>) => {
    return apiClient.post<ProposalSection>(`/api/proposals/${proposalId}/sections`, data);
  },

  updateSection: async (proposalId: number, sectionId: number, data: Partial<ProposalSection>) => {
    return apiClient.put<ProposalSection>(`/api/proposals/${proposalId}/sections/${sectionId}`, data);
  },

  deleteSection: async (proposalId: number, sectionId: number) => {
    return apiClient.delete(`/api/proposals/${proposalId}/sections/${sectionId}`);
  },

  reorderSections: async (proposalId: number, sectionIds: number[]) => {
    return apiClient.post(`/api/proposals/${proposalId}/sections/reorder`, { section_ids: sectionIds });
  },

  // Section Content
  addContentToSection: async (
    proposalId: number,
    sectionId: number,
    data: {
      source_block_id?: number;
      content: string;
      title?: string;
      order: number;
      is_custom: boolean;
    }
  ) => {
    return apiClient.post<ProposalContent>(
      `/api/proposals/${proposalId}/sections/${sectionId}/content`,
      data
    );
  },

  updateSectionContent: async (
    proposalId: number,
    sectionId: number,
    contentId: number,
    data: Partial<ProposalContent>
  ) => {
    return apiClient.put<ProposalContent>(
      `/api/proposals/${proposalId}/sections/${sectionId}/content/${contentId}`,
      data
    );
  },

  deleteSectionContent: async (proposalId: number, sectionId: number, contentId: number) => {
    return apiClient.delete(`/api/proposals/${proposalId}/sections/${sectionId}/content/${contentId}`);
  },

  // RFP Requirements
  getRequirements: async (proposalId: number) => {
    return apiClient.get<RFPRequirement[]>(`/api/proposals/${proposalId}/requirements`);
  },

  createRequirement: async (proposalId: number, data: Partial<RFPRequirement>) => {
    return apiClient.post<RFPRequirement>(`/api/proposals/${proposalId}/requirements`, data);
  },

  updateRequirement: async (proposalId: number, requirementId: number, data: Partial<RFPRequirement>) => {
    return apiClient.put<RFPRequirement>(
      `/api/proposals/${proposalId}/requirements/${requirementId}`,
      data
    );
  },

  deleteRequirement: async (proposalId: number, requirementId: number) => {
    return apiClient.delete(`/api/proposals/${proposalId}/requirements/${requirementId}`);
  },

  // Documents
  uploadDocument: async (proposalId: number, file: File, purpose?: string, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    if (purpose) formData.append('purpose', purpose);
    return apiClient.upload<ProposalDocument>(
      `/api/proposals/${proposalId}/documents`,
      formData,
      onProgress
    );
  },

  getDocuments: async (proposalId: number) => {
    return apiClient.get<ProposalDocument[]>(`/api/proposals/${proposalId}/documents`);
  },

  deleteDocument: async (proposalId: number, documentId: number) => {
    return apiClient.delete(`/api/proposals/${proposalId}/documents/${documentId}`);
  },

  // Notes
  getNotes: async (proposalId: number, sectionId?: number) => {
    const params = sectionId ? { section_id: sectionId } : undefined;
    return apiClient.get<ProposalNote[]>(`/api/proposals/${proposalId}/notes`, { params });
  },

  createNote: async (proposalId: number, data: Partial<ProposalNote>) => {
    return apiClient.post<ProposalNote>(`/api/proposals/${proposalId}/notes`, data);
  },

  updateNote: async (proposalId: number, noteId: number, data: Partial<ProposalNote>) => {
    return apiClient.put<ProposalNote>(`/api/proposals/${proposalId}/notes/${noteId}`, data);
  },

  deleteNote: async (proposalId: number, noteId: number) => {
    return apiClient.delete(`/api/proposals/${proposalId}/notes/${noteId}`);
  },

  // Export
  exportProposal: async (proposalId: number, formattingInstructions?: string) => {
    return apiClient.post<Blob>(
      `/api/proposals/${proposalId}/export`,
      { formatting_instructions: formattingInstructions },
      {
        responseType: 'blob',
      }
    );
  },

  exportSection: async (proposalId: number, sectionId: number, formattingInstructions?: string) => {
    return apiClient.post<Blob>(
      `/api/proposals/${proposalId}/sections/${sectionId}/export`,
      { formatting_instructions: formattingInstructions },
      {
        responseType: 'blob',
      }
    );
  },

  // RFP Processing
  extractRFPRequirements: async (proposalId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<{ requirements: RFPRequirement[]; message: string }>(
      `/api/proposals/${proposalId}/rfp/extract`,
      formData
    );
  },
};
