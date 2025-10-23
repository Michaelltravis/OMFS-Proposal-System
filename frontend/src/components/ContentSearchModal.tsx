/**
 * Content Search Modal - Browse and select content blocks from the library
 */
import { useState } from 'react';
import { Search, X, Filter, Check, Eye, Maximize2, Minimize2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services/contentService';
import type { ContentBlock, Tag, SectionType } from '../types';

interface ContentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContent: (contentIds: number[]) => void;
  sectionId: number;
}

export function ContentSearchModal({ isOpen, onClose, onAddContent, sectionId }: ContentSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSectionTypes, setSelectedSectionTypes] = useState<number[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(new Set());
  const [previewBlock, setPreviewBlock] = useState<ContentBlock | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch content blocks
  const { data: blocksData, isLoading: loadingBlocks } = useQuery({
    queryKey: ['content-blocks', searchQuery, selectedTags, selectedSectionTypes[0]],
    queryFn: () =>
      contentService.getContentBlocks({
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        section_type_id: selectedSectionTypes.length > 0 ? selectedSectionTypes[0] : undefined,
        page: 1,
        limit: 50,
      }),
    enabled: isOpen,
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => contentService.getTags(),
    enabled: isOpen && showFilters,
  });

  // Fetch section types
  const { data: sectionTypes = [] } = useQuery({
    queryKey: ['section-types'],
    queryFn: () => contentService.getSectionTypes(),
    enabled: isOpen && showFilters,
  });

  const contentBlocks = blocksData?.items || [];

  const toggleBlockSelection = (blockId: number) => {
    setSelectedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const toggleSectionType = (typeId: number) => {
    setSelectedSectionTypes(prev =>
      prev.includes(typeId) ? prev.filter(t => t !== typeId) : [...prev, typeId]
    );
  };

  const handleAddSelected = () => {
    console.log('ContentSearchModal: handleAddSelected called');
    console.log('Selected blocks:', Array.from(selectedBlocks));

    if (selectedBlocks.size > 0) {
      const blockIds = Array.from(selectedBlocks);
      console.log('Calling onAddContent with:', blockIds);
      onAddContent(blockIds);
      setSelectedBlocks(new Set());
      onClose();
    } else {
      console.log('No blocks selected, not calling onAddContent');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedSectionTypes([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl flex flex-col transition-all ${
        isFullscreen ? 'w-screen h-screen m-0' : 'w-full max-w-6xl h-[85vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Content from Library</h2>
            <p className="text-gray-600 mt-1">
              Search and select content blocks to add to this section
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="flex gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters || selectedTags.length > 0 || selectedSectionTypes.length > 0
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(selectedTags.length > 0 || selectedSectionTypes.length > 0) && (
                <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedTags.length + selectedSectionTypes.length}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Active Filters</h3>
                {(selectedTags.length > 0 || selectedSectionTypes.length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Section Types Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Section Type Labels
                </label>
                <div className="flex flex-wrap gap-2">
                  {sectionTypes.map((type: SectionType) => (
                    <button
                      key={type.id}
                      onClick={() => toggleSectionType(type.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedSectionTypes.includes(type.id)
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
                      }`}
                    >
                      {type.display_name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: Tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedTags.includes(tag.name)
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Content Blocks List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingBlocks ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading content blocks...</div>
              </div>
            ) : contentBlocks.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="font-medium">No content blocks found</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {contentBlocks.map((block: ContentBlock) => {
                  const isSelected = selectedBlocks.has(block.id);
                  return (
                    <div
                      key={block.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleBlockSelection(block.id)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-gray-300 hover:border-primary-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </button>

                        {/* Content Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-1">{block.title}</h3>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                            {block.word_count && <span>{block.word_count} words</span>}
                            {block.estimated_pages && (
                              <>
                                <span>•</span>
                                <span>~{block.estimated_pages} pages</span>
                              </>
                            )}
                            {block.usage_count !== undefined && (
                              <>
                                <span>•</span>
                                <span>Used {block.usage_count} times</span>
                              </>
                            )}
                          </div>

                          {/* Tags */}
                          {block.tags && block.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {block.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="px-2 py-0.5 rounded text-xs"
                                  style={{
                                    backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                                    color: tag.color || '#6b7280',
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Section Types */}
                          {block.section_types && block.section_types.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {block.section_types.map((type) => (
                                <span
                                  key={type.id}
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: type.color ? `${type.color}15` : '#f3f4f6',
                                    color: type.color || '#4b5563',
                                  }}
                                >
                                  {type.display_name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Preview Content */}
                          <div
                            className="mt-2 text-sm text-gray-600 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: block.content.substring(0, 150) + '...',
                            }}
                          />
                        </div>

                        {/* Preview Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewBlock(block);
                          }}
                          className="flex-shrink-0 p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          title="Preview full content"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {previewBlock && (
            <div className="w-96 border-l border-gray-200 flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <h3 className="font-semibold text-gray-900">Content Preview</h3>
                <button
                  onClick={() => setPreviewBlock(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {previewBlock.title}
                </h4>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewBlock.content }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedBlocks.size > 0 ? (
              <span className="font-medium">
                {selectedBlocks.size} block{selectedBlocks.size !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>Select content blocks to add to this section</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedBlocks.size === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected ({selectedBlocks.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
