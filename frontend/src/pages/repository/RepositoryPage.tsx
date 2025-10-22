/**
 * Content Repository Page - Main library interface
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, X, History, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { contentService } from '../../services/contentService';
import type { ContentBlock, ContentVersion } from '../../types';
import { ContentEditorModal } from '../../components/ContentEditorModal';
import { AdvancedFilterModal } from '../../components/AdvancedFilterModal';
import * as DiffMatchPatch from 'diff-match-patch';
import { sanitizeHtml } from '../../utils/sanitizer';

export const RepositoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  // Pending filters (not yet applied)
  const [pendingSectionTypeId, setPendingSectionTypeId] = useState<number | null>(null);
  const [pendingTags, setPendingTags] = useState<string[]>([]);

  // Applied filters (used in API query)
  const [appliedSectionTypeId, setAppliedSectionTypeId] = useState<number | null>(null);
  const [appliedTags, setAppliedTags] = useState<string[]>([]);

  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [sectionTypeSearchQuery, setSectionTypeSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const queryClient = useQueryClient();

  // Handler for when content is saved
  const handleContentSaved = () => {
    // Invalidate both content blocks and tags queries to refresh with new data
    queryClient.invalidateQueries({ queryKey: ['content-blocks'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    setIsEditorOpen(false);
    setEditingBlock(null);
  };

  // Fetch content blocks with applied filters
  const { data, isLoading } = useQuery({
    queryKey: ['content-blocks', { query: searchQuery, section_type_id: appliedSectionTypeId, tags: appliedTags }],
    queryFn: () =>
      contentService.getContentBlocks({
        query: searchQuery || undefined,
        section_type_id: appliedSectionTypeId || undefined,
        tags: appliedTags.length > 0 ? appliedTags : undefined,
      }),
  });

  // Apply filters handler
  const applyFilters = () => {
    setAppliedSectionTypeId(pendingSectionTypeId);
    setAppliedTags(pendingTags);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPendingSectionTypeId(null);
    setPendingTags([]);
    setAppliedSectionTypeId(null);
    setAppliedTags([]);
  };

  // Handle advanced filter modal apply
  const handleAdvancedFilterApply = (sectionTypeIds: number[], tagNames: string[]) => {
    // For now, we only support single section type filter in the main query
    // If multiple section types are selected, we'll use the first one
    // This could be enhanced later to support multiple section types
    setPendingSectionTypeId(sectionTypeIds.length > 0 ? sectionTypeIds[0] : null);
    setAppliedSectionTypeId(sectionTypeIds.length > 0 ? sectionTypeIds[0] : null);

    setPendingTags(tagNames);
    setAppliedTags(tagNames);
  };

  // Fetch available tags
  const { data: availableTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => contentService.getTags(),
  });

  // Fetch available section types
  const { data: availableSectionTypes } = useQuery({
    queryKey: ['section-types'],
    queryFn: () => contentService.getSectionTypes(),
  });

  const tabs = [
    { id: 'all', label: 'All Content', count: data?.total || 0 },
  ];

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Filters */}
      <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </h2>
            <button
              onClick={() => setIsAdvancedFilterOpen(true)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </button>
          </div>

          {/* Section Type Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Section Type Labels</h3>
            {/* Section Type Search Input */}
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search section types..."
                value={sectionTypeSearchQuery}
                onChange={(e) => setSectionTypeSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setPendingSectionTypeId(null)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  pendingSectionTypeId === null
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Types
              </button>
              {availableSectionTypes && availableSectionTypes
                .filter((type) =>
                  type.display_name.toLowerCase().includes(sectionTypeSearchQuery.toLowerCase()) ||
                  type.name.toLowerCase().includes(sectionTypeSearchQuery.toLowerCase())
                )
                .map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setPendingSectionTypeId(type.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                      pendingSectionTypeId === type.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color || '#6B7280' }}
                    />
                    {type.display_name}
                  </button>
                ))}
              {availableSectionTypes && availableSectionTypes.filter((type) =>
                type.display_name.toLowerCase().includes(sectionTypeSearchQuery.toLowerCase()) ||
                type.name.toLowerCase().includes(sectionTypeSearchQuery.toLowerCase())
              ).length === 0 && sectionTypeSearchQuery && (
                <div className="text-sm text-gray-500 px-3 py-2 text-center">No matching types</div>
              )}
              {!availableSectionTypes && (
                <div className="text-sm text-gray-500 px-3 py-2">Loading...</div>
              )}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Tags</h3>
              {pendingTags.length > 0 && (
                <button
                  onClick={() => setPendingTags([])}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Clear
                </button>
              )}
            </div>
            {/* Tag Search Input */}
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableTags && availableTags.length > 0 ? (
                availableTags
                  .filter((tag) =>
                    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                  )
                  .map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={pendingTags.includes(tag.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPendingTags([...pendingTags, tag.name]);
                          } else {
                            setPendingTags(pendingTags.filter((t) => t !== tag.name));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color || '#6B7280' }}
                      />
                      <span className="text-sm text-gray-700 flex-1">{tag.name}</span>
                      <span className="text-xs text-gray-500">{tag.usage_count || 0}</span>
                    </label>
                  ))
              ) : (
                <div className="text-sm text-gray-500 px-3 py-2">No tags available</div>
              )}
            </div>
          </div>

          {/* Apply Filters Button */}
          <div className="mt-6 space-y-2">
            <button
              onClick={applyFilters}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              Apply Filters
            </button>
            {(appliedSectionTypeId !== null || appliedTags.length > 0) && (
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Search and Actions */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Press '/' for AI Assistant"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                setEditingBlock(null);
                setIsEditorOpen(true);
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Content
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-primary-600">
              Ask
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading content...</div>
          ) : data && data.items.length > 0 ? (
            <div className="space-y-4">
              {data.items.map((block) => (
                <ContentBlockCard
                  key={block.id}
                  block={block}
                  onClick={() => setSelectedBlock(block)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Filter className="w-12 h-12 mx-auto mb-3" />
              </div>
              {(appliedSectionTypeId !== null || appliedTags.length > 0 || searchQuery.trim() !== '') ? (
                <div>
                  <p className="text-gray-700 font-medium mb-1">No content blocks found</p>
                  <p className="text-gray-500 text-sm">
                    Try adjusting your filters or search criteria
                  </p>
                  {(appliedSectionTypeId !== null || appliedTags.length > 0) && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-4 px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 font-medium mb-1">No content blocks yet</p>
                  <p className="text-gray-500 text-sm">
                    Create your first content block to get started
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Detail Modal */}
      {selectedBlock && (
        <ContentDetailModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
          onEdit={(block) => {
            setEditingBlock(block);
            setIsEditorOpen(true);
            setSelectedBlock(null);
          }}
        />
      )}

      {/* Content Editor Modal */}
      {isEditorOpen && (
        <ContentEditorModal
          block={editingBlock}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingBlock(null);
          }}
          onSave={handleContentSaved}
        />
      )}

      {/* Advanced Filter Modal */}
      {isAdvancedFilterOpen && (
        <AdvancedFilterModal
          onClose={() => setIsAdvancedFilterOpen(false)}
          onApply={handleAdvancedFilterApply}
          initialSectionTypeIds={appliedSectionTypeId !== null ? [appliedSectionTypeId] : []}
          initialTagNames={appliedTags}
        />
      )}
    </div>
  );
};

// Content Block Card Component
const ContentBlockCard = ({ block, onClick }: { block: ContentBlock; onClick: () => void }) => {
  const stripHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const preview = stripHtml(block.content).substring(0, 200);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">
              Last Updated On {new Date(block.created_at).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{block.title}</h3>
          <div className="flex items-center gap-2">
            {/* Star Rating */}
            {block.quality_rating && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-yellow-500">
                  {'★'.repeat(Math.round(block.quality_rating))}
                </span>
              </div>
            )}
            {/* Usage Count */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Used: {block.usage_count || 0}</span>
            </div>
            {/* Section Type Labels */}
            {block.section_types && block.section_types.map((st) => (
              <span
                key={st.id}
                className="px-2 py-1 text-white text-xs rounded-full font-medium"
                style={{ backgroundColor: st.color }}
                title={st.description}
              >
                {st.display_name}
              </span>
            ))}
            {/* Tags */}
            {block.tags && block.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="mt-3">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="text-sm text-gray-700 line-clamp-3">{preview}...</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button className="text-sm text-gray-600 hover:text-gray-900">Response</button>
        <button className="text-sm text-gray-600 hover:text-gray-900">Copy</button>
        <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
      </div>
    </div>
  );
};

// Helper function to strip HTML tags while preserving structure
const stripHtml = (html: string): string => {
  // Convert HTML to preserve document structure
  let text = html
    // Add double newlines after headings and paragraphs for proper spacing
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    // Convert list items to newlines
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    // Convert line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Add spacing after closing block elements
    .replace(/<\/ul>/gi, '\n')
    .replace(/<\/ol>/gi, '\n');

  // Now strip remaining HTML tags
  const div = document.createElement('div');
  div.innerHTML = text;

  // Get text and clean up excessive newlines (max 2 consecutive)
  return (div.textContent || div.innerText || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Helper function to generate diff HTML
const generateDiffHtml = (oldText: string, newText: string): string => {
  const dmp = new DiffMatchPatch.diff_match_patch();
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  let html = '';
  for (const [operation, text] of diffs) {
    // Escape HTML but preserve newlines for CSS white-space handling
    const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (operation === -1) {
      // Deletion - red with strikethrough
      html += `<span style="background-color: #fee; color: #c00; text-decoration: line-through;">${escapedText}</span>`;
    } else if (operation === 1) {
      // Addition - blue/green
      html += `<span style="background-color: #dfd; color: #080;">${escapedText}</span>`;
    } else {
      // No change
      html += `<span>${escapedText}</span>`;
    }
  }

  return html;
};

// Content Detail Modal Component
const ContentDetailModal = ({
  block,
  onClose,
  onEdit,
}: {
  block: ContentBlock;
  onClose: () => void;
  onEdit: (block: ContentBlock) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'versions'>('content');
  const [showingDiffFor, setShowingDiffFor] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch versions
  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['content-versions', block.id],
    queryFn: () => contentService.getVersions(block.id),
    enabled: activeTab === 'versions',
  });

  // Revert mutation
  const revertMutation = useMutation({
    mutationFn: ({ versionId }: { versionId: number }) =>
      contentService.revertToVersion(block.id, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['content-versions', block.id] });
      alert('Successfully reverted to selected version!');
      onClose();
    },
    onError: (error: any) => {
      alert(`Failed to revert: ${error.message}`);
    },
  });

  const handleRevert = (versionId: number, versionNumber: number) => {
    if (confirm(`Are you sure you want to revert to Version ${versionNumber}? This will create a new version with that content.`)) {
      revertMutation.mutate({ versionId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{block.title}</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-500">
                Section: {block.section_type.replace('_', ' ')}
              </span>
              {block.quality_rating && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-yellow-500">
                    {'★'.repeat(Math.round(block.quality_rating))}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-600">Used: {block.usage_count || 0}</span>
              {block.section_types && block.section_types.map((st) => (
                <span
                  key={st.id}
                  className="px-2 py-1 text-white text-xs rounded-full font-medium"
                  style={{ backgroundColor: st.color }}
                  title={st.description}
                >
                  {st.display_name}
                </span>
              ))}
              {block.tags && block.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 text-xs rounded"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'content'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'versions'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4" />
              Version History
              {versions && versions.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {versions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'content' ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(block.content) }}
            />
          ) : (
            <div>
              {versionsLoading ? (
                <div className="text-center py-12 text-gray-500">Loading version history...</div>
              ) : versions && versions.length > 0 ? (
                <div className="space-y-4">
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">How Version History Works</h3>
                    <p className="text-xs text-blue-700">
                      Every time you edit this content block, a snapshot is saved. You can view past versions and revert to any previous version if needed.
                    </p>
                  </div>
                  {versions.map((version, index) => {
                    const previousVersion = versions[index + 1];
                    const isShowingDiff = showingDiffFor === version.id;

                    return (
                      <div key={version.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                Version {version.version_number}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(version.created_at).toLocaleString()}
                              </span>
                            </div>
                            {version.change_description && (
                              <p className="text-sm text-gray-600 mb-2">{version.change_description}</p>
                            )}
                            <div className="text-xs text-gray-500">
                              <strong>Title:</strong> {version.title}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {previousVersion && (
                              <button
                                onClick={() => setShowingDiffFor(isShowingDiff ? null : version.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                title={isShowingDiff ? "Hide changes" : "View changes from previous version"}
                              >
                                {isShowingDiff ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    Hide Changes
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    View Changes
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleRevert(version.id, version.version_number)}
                              disabled={revertMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Revert to this version"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Revert
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-100">
                          {isShowingDiff && previousVersion ? (
                            <div>
                              <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">Deleted</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Added</span>
                                <span className="ml-auto">Comparing with Version {previousVersion.version_number}</span>
                              </div>
                              <div
                                className="prose prose-xs max-w-none text-sm"
                                style={{ whiteSpace: 'pre-wrap' }}
                                dangerouslySetInnerHTML={{
                                  __html: sanitizeHtml(generateDiffHtml(
                                    stripHtml(previousVersion.content),
                                    stripHtml(version.content)
                                  )),
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className="prose prose-xs max-w-none text-sm line-clamp-4"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(version.content) }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-1">No version history yet</p>
                  <p className="text-sm text-gray-400">
                    Version history will be created when you edit this content block.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex gap-2">
            {activeTab === 'content' && (
              <>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  Copy Content
                </button>
                <button
                  onClick={() => onEdit(block)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit
                </button>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
