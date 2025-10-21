/**
 * TypeScript type definitions for the application
 */

// Content Repository Types

export interface ContentBlock {
  id: number;
  title: string;
  content: string; // Rich HTML
  section_type: string;
  estimated_pages?: number;
  word_count?: number;
  parent_id?: number;
  path?: string;
  document_source_id?: number;
  context_metadata?: Record<string, any>;
  quality_rating?: number;
  usage_count: number;
  customization_history?: CustomizationHistoryEntry[];
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_deleted: boolean;
  tags?: Tag[];
  section_types?: SectionType[];
  parent?: ContentBlock;
  children?: ContentBlock[];
}

export interface CustomizationHistoryEntry {
  proposal: string;
  date: string;
  changes: string;
  level: 'light' | 'moderate' | 'heavy';
}

export interface ContentChunk {
  id: number;
  content_block_id: number;
  chunk_text: string;
  chunk_index: number;
  overlap_text?: string;
  embedding_id?: string;
  created_at: string;
}

export interface ContentVersion {
  id: number;
  content_block_id: number;
  version_number: number;
  title: string;
  content: string;
  context_metadata?: Record<string, any>;
  change_description?: string;
  created_at: string;
  created_by?: string;
}

export interface Tag {
  id: number;
  name: string;
  category?: string;
  color?: string;
  usage_count: number;
  created_at: string;
}

export interface SectionType {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  usage_count: number;
  created_at: string;
}

// Proposal Builder Types

export type ProposalStatus = 'draft' | 'in_progress' | 'review' | 'completed' | 'archived';

export type SectionStatus = 'not_started' | 'in_progress' | 'completed' | 'pending';

export type RequirementStatus = 'not_addressed' | 'partially_addressed' | 'fully_addressed';

export interface Proposal {
  id: number;
  name: string;
  client_name?: string;
  rfp_number?: string;
  rfp_deadline?: string;
  page_limit?: number;
  estimated_pages?: number;
  status: ProposalStatus;
  is_archived: boolean;
  notes?: string;
  rfp_context?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  sections?: ProposalSection[];
  requirements?: RFPRequirement[];
  documents?: ProposalDocument[];
  proposal_notes?: ProposalNote[];
}

export interface ProposalSection {
  id: number;
  proposal_id: number;
  title: string;
  section_type?: string;
  order: number;
  page_target_min?: number;
  page_target_max?: number;
  current_pages?: number;
  status: SectionStatus;
  notes?: string;
  requirements?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  contents?: ProposalContent[];
}

export interface ProposalContent {
  id: number;
  section_id: number;
  source_block_id?: number;
  is_custom: boolean;
  content: string; // Rich HTML
  title?: string;
  order: number;
  word_count?: number;
  estimated_pages?: number;
  customization_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface RFPRequirement {
  id: number;
  proposal_id: number;
  requirement_number?: string;
  requirement_text: string;
  section?: string;
  status: RequirementStatus;
  coverage_notes?: string;
  addressed_in_section_id?: number;
  priority?: string;
  is_mandatory: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProposalDocument {
  id: number;
  proposal_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  purpose?: string;
  description?: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface ProposalNote {
  id: number;
  proposal_id: number;
  section_id?: number;
  note_text: string;
  note_type?: string;
  author?: string;
  created_at: string;
  updated_at?: string;
}

// Search and Filter Types

export interface SearchParams {
  query?: string;
  section_type?: string;
  tags?: string[];
  client_type?: string;
  facility_type?: string;
  min_rating?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: ContentBlock[];
  total: number;
  page: number;
  pages: number;
}

// API Response Types

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// UI State Types

export interface FilterState {
  sectionTypes: string[];
  tags: string[];
  clientTypes: string[];
  facilityTypes: string[];
  dateRange?: { from: string; to: string };
  minRating?: number;
}

export interface EditorState {
  content: string;
  isSaving: boolean;
  lastSaved?: string;
}
