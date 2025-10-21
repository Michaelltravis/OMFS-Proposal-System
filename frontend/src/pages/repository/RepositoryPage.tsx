/**
 * Content Repository Page - Main library interface
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Filter, X } from 'lucide-react';
import { contentService } from '../../services/contentService';
import type { ContentBlock } from '../../types';
import { ContentEditorModal } from '../../components/ContentEditorModal';

export const RepositoryPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedSectionType, setSelectedSectionType] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);

  // Fetch content blocks
  const { data, isLoading } = useQuery({
    queryKey: ['content-blocks', { search: searchQuery, section_type: selectedSectionType }],
    queryFn: () =>
      contentService.getContentBlocks({
        search: searchQuery || undefined,
        section_type: selectedSectionType || undefined,
      }),
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
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
            <div className="space-y-1">
              <div className="text-sm text-gray-500">No tags selected</div>
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

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              Copy Content
            </button>
            <button
              onClick={() => onEdit(block)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Edit
            </button>
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
