/**
 * Content Repository Page - Main library interface
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, X, History, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { contentService } from '../../services/contentService';
import type { ContentBlock, ContentVersion } from '../../types';
import { ContentEditorModal } from '../../components/ContentEditorModal';
import * as DiffMatchPatch from 'diff-match-patch';

export const RepositoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedSectionType, setSelectedSectionType] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);

  // Fetch content blocks
  const { data, isLoading } = useQuery({
    queryKey: ['content-blocks', { query: searchQuery, section_type: selectedSectionType, tags: selectedTags }],
    queryFn: () =>
      contentService.getContentBlocks({
        query: searchQuery || undefined,
        section_type: selectedSectionType || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }),
  });

  // Fetch available tags
  const { data: availableTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => contentService.getTags(),
  });

  const tabs = [
    { id: 'all', label: 'All Content', count: data?.total || 0 },
    { id: 'technical', label: 'Technical Approach', count: 0 },
    { id: 'performance', label: 'Past Performance', count: 0 },
    { id: 'qualifications', label: 'Qualifications', count: 0 },
  ];

  const sectionTypes = [
    'technical_approach',
    'past_performance',
    'executive_summary',
    'qualifications',
    'pricing',
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
            <button className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </button>
          </div>

          {/* Section Type Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Section Type</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedSectionType(null)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedSectionType === null
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Types
              </button>
              {sectionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedSectionType(type)}
                  className={`w-full text-left px-3 py-2 rounded text-sm capitalize ${
                    selectedSectionType === type
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Tags</h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableTags && availableTags.length > 0 ? (
                availableTags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTags([...selectedTags, tag.name]);
                        } else {
                          setSelectedTags(selectedTags.filter((t) => t !== tag.name));
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
            <div className="text-center py-12 text-gray-500">
              No content blocks found. Create your first one!
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
          onSave={() => {
            setIsEditorOpen(false);
            setEditingBlock(null);
            // Refresh the content list
            window.location.reload();
          }}
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
              dangerouslySetInnerHTML={{ __html: block.content }}
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
                                  __html: generateDiffHtml(
                                    stripHtml(previousVersion.content),
                                    stripHtml(version.content)
                                  ),
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              className="prose prose-xs max-w-none text-sm line-clamp-4"
                              dangerouslySetInnerHTML={{ __html: version.content }}
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
