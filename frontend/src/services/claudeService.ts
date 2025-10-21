/**
 * Claude AI API service
 */
import { apiClient } from './api';

export interface ClaudeGenerationRequest {
  prompt: string;
  context_blocks?: number[]; // IDs of content blocks to use as context
  context_text?: string; // Additional context
  max_tokens?: number;
  temperature?: number;
}

export interface ClaudeGenerationResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeSkill {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  parameters?: Record<string, any>;
}

export const claudeService = {
  // Generate content
  generate: async (request: ClaudeGenerationRequest) => {
    return apiClient.post<ClaudeGenerationResponse>('/api/claude/generate', request);
  },

  // Refine/rewrite content
  refine: async (content: string, instructions: string) => {
    return apiClient.post<ClaudeGenerationResponse>('/api/claude/refine', {
      content,
      instructions,
    });
  },

  // Summarize content
  summarize: async (content: string, target_length?: string) => {
    return apiClient.post<ClaudeGenerationResponse>('/api/claude/summarize', {
      content,
      target_length,
    });
  },

  // Expand content
  expand: async (content: string, additional_context?: string) => {
    return apiClient.post<ClaudeGenerationResponse>('/api/claude/expand', {
      content,
      additional_context,
    });
  },

  // Adapt content for new context
  adapt: async (
    content: string,
    newContext: {
      client_name?: string;
      project_type?: string;
      specific_requirements?: string;
      constraints?: string;
    }
  ) => {
    return apiClient.post<ClaudeGenerationResponse>('/api/claude/adapt', {
      content,
      new_context: newContext,
    });
  },

  // Skills
  getSkills: async () => {
    return apiClient.get<ClaudeSkill[]>('/api/claude/skills');
  },

  executeSkill: async (skillId: string, parameters: Record<string, any>) => {
    return apiClient.post<ClaudeGenerationResponse>(`/api/claude/skills/${skillId}/execute`, parameters);
  },

  createSkill: async (skill: Partial<ClaudeSkill>) => {
    return apiClient.post<ClaudeSkill>('/api/claude/skills', skill);
  },

  updateSkill: async (skillId: string, skill: Partial<ClaudeSkill>) => {
    return apiClient.put<ClaudeSkill>(`/api/claude/skills/${skillId}`, skill);
  },

  deleteSkill: async (skillId: string) => {
    return apiClient.delete(`/api/claude/skills/${skillId}`);
  },

  // Chat interface
  chat: async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
    return apiClient.post<ClaudeGenerationResponse>('/api/claude/chat', { messages });
  },
};
