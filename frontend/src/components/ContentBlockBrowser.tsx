/**
 * Content Block Browser - Browse and select content blocks to link to proposal sections
 */
import { useState, useEffect } from 'react';
import { Search, X, Plus, Loader2, Tag as TagIcon, FileText, ChevronRight } from 'lucide-react';
import { contentService } from '../services/contentService';
import type { ContentBlock, Tag, SectionType } from '../types';

interface ContentBlockBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (block: ContentBlock) => void;
  sectionType?: string;
  title?: string;
}

export const ContentBlockBrowser = ({
  isOpen,
  onClose,
  onSelectBlock,
  sectionType,
  title = 'Select Content Block',
}: ContentBlockBrowserProps) => {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);
  const [previewBlock, setPreviewBlock] = useState<ContentBlock | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadContentBlocks();
    }
  }, [isOpen, sectionType, searchQuery, currentPage]);

  const loadContentBlocks = async () => {
    try {
      setLoading(true);
      const response = await contentService.getContentBlocks({
        section_type: sectionType,
        query: searchQuery || undefined,
        page: currentPage,
        limit: 10,
      });
      setContentBlocks(response.data.items);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error loading content blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBlock = (block: ContentBlock) => {
    setSelectedBlock(block);
    setPreviewBlock(block);
  };

  const handleAddBlock = () => {
    if (selectedBlock) {
      onSelectBlock(selectedBlock);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedBlock(null);
    setPreviewBlock(null);
    setCurrentPage(1);
    onClose();
  };

  const truncateContent = (html: string, maxLength: number = 200) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {sectionType && (
              <p className="text-sm text-gray-600 mt-1">
                Showing content blocks for: <span className="font-medium">{sectionType.replace('_', ' ')}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search content blocks by title or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Content Blocks List */}
          <div className="w-1/2 border-r border-gray-200 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : contentBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText className="w-12 h-12 mb-3" />
                <p className="text-lg font-medium">No content blocks found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {contentBlocks.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => handleSelectBlock(block)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedBlock?.id === block.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1">{block.title}</h3>
                      <ChevronRight
                        className={`w-5 h-5 transition-colors ${
                          selectedBlock?.id === block.id ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{truncateContent(block.content)}</p>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {block.word_count && (
                        <span>{block.word_count} words</span>
                      )}
                      {block.estimated_pages && (
                        <span>~{block.estimated_pages} pages</span>
                      )}
                      {block.quality_rating && (
                        <span>⭐ {block.quality_rating.toFixed(1)}</span>
                      )}
                      {block.usage_count > 0 && (
                        <span>Used {block.usage_count}x</span>
                      )}
                    </div>

                    {/* Tags */}
                    {block.tags && block.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {block.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                              color: tag.color || '#374151',
                            }}
                          >
                            <TagIcon className="w-3 h-3" />
                            {tag.name}
                          </span>
                        ))}
                        {block.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{block.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 overflow-auto bg-gray-50">
            {previewBlock ? (
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{previewBlock.title}</h2>

                {/* Metadata */}
                <div className="bg-white rounded-lg p-4 mb-4 space-y-2 text-sm">
                  {previewBlock.section_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Section Type:</span>
                      <span className="font-medium text-gray-900">
                        {previewBlock.section_type.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  {previewBlock.word_count && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Word Count:</span>
                      <span className="font-medium text-gray-900">{previewBlock.word_count}</span>
                    </div>
                  )}
                  {previewBlock.estimated_pages && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Estimated Pages:</span>
                      <span className="font-medium text-gray-900">{previewBlock.estimated_pages}</span>
                    </div>
                  )}
                  {previewBlock.quality_rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Quality Rating:</span>
                      <span className="font-medium text-gray-900">
                        ⭐ {previewBlock.quality_rating.toFixed(1)} / 5.0
                      </span>
                    </div>
                  )}
                  {previewBlock.usage_count > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Usage Count:</span>
                      <span className="font-medium text-gray-900">{previewBlock.usage_count}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {previewBlock.tags && previewBlock.tags.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {previewBlock.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                          style={{
                            backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                            color: tag.color || '#374151',
                          }}
                        >
                          <TagIcon className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Preview */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Content Preview</h3>
                  <div
                    className="bg-white rounded-lg p-6 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewBlock.content }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3" />
                  <p>Select a content block to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddBlock}
            disabled={!selectedBlock}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Section</span>
          </button>
        </div>
      </div>
    </div>
  );
};
