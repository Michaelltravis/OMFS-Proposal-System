/**
 * Advanced Filter Modal - Multi-select filtering for section types and tags
 */
import { useState, useEffect } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services/contentService';
import type { SectionType, Tag } from '../types';

interface AdvancedFilterModalProps {
  onClose: () => void;
  onApply: (sectionTypeIds: number[], tagNames: string[]) => void;
  initialSectionTypeIds?: number[];
  initialTagNames?: string[];
}

export function AdvancedFilterModal({
  onClose,
  onApply,
  initialSectionTypeIds = [],
  initialTagNames = [],
}: AdvancedFilterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionTypeIds, setSelectedSectionTypeIds] = useState<number[]>(initialSectionTypeIds);
  const [selectedTagNames, setSelectedTagNames] = useState<string[]>(initialTagNames);

  // Fetch section types
  const { data: sectionTypes = [], isLoading: loadingSectionTypes } = useQuery({
    queryKey: ['section-types'],
    queryFn: () => contentService.getSectionTypes(),
  });

  // Fetch tags
  const { data: tags = [], isLoading: loadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => contentService.getTags(),
  });

  // Filter section types and tags by search query
  const filteredSectionTypes = sectionTypes.filter((st: SectionType) =>
    st.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (st.description && st.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTags = tags.filter((tag: Tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSectionType = (sectionTypeId: number) => {
    setSelectedSectionTypeIds((prev) =>
      prev.includes(sectionTypeId)
        ? prev.filter((id) => id !== sectionTypeId)
        : [...prev, sectionTypeId]
    );
  };

  const toggleTag = (tagName: string) => {
    setSelectedTagNames((prev) =>
      prev.includes(tagName)
        ? prev.filter((name) => name !== tagName)
        : [...prev, tagName]
    );
  };

  const handleClearAll = () => {
    setSelectedSectionTypeIds([]);
    setSelectedTagNames([]);
  };

  const handleApply = () => {
    onApply(selectedSectionTypeIds, selectedTagNames);
    onClose();
  };

  const totalSelected = selectedSectionTypeIds.length + selectedTagNames.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Advanced Filters</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select multiple section types and tags to filter content blocks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search section types and tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section Types */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Section Type Labels ({selectedSectionTypeIds.length} selected)
            </h3>
            {loadingSectionTypes ? (
              <div className="text-gray-500">Loading section types...</div>
            ) : filteredSectionTypes.length === 0 ? (
              <div className="text-gray-500">No section types found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredSectionTypes.map((st: SectionType) => {
                  const isSelected = selectedSectionTypeIds.includes(st.id);
                  return (
                    <label
                      key={st.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSectionType(st.id)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: st.color || '#6B7280' }}
                          />
                          <span className="font-medium text-gray-900">
                            {st.display_name}
                          </span>
                        </div>
                        {st.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {st.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Tags ({selectedTagNames.length} selected)
            </h3>
            {loadingTags ? (
              <div className="text-gray-500">Loading tags...</div>
            ) : filteredTags.length === 0 ? (
              <div className="text-gray-500">No tags found</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredTags.map((tag: Tag) => {
                  const isSelected = selectedTagNames.includes(tag.name);
                  return (
                    <label
                      key={tag.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary-100 ring-2 ring-primary-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTag(tag.name)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                      />
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color || '#6B7280' }}
                        />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {tag.name}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearAll}
              disabled={totalSelected === 0}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
            >
              Clear All
            </button>
            {totalSelected > 0 && (
              <span className="text-sm text-gray-600">
                {totalSelected} filter{totalSelected !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
