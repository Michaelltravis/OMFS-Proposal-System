/**
 * TagSelector Component - Allows users to select existing tags or create new ones
 */
import { useState, useEffect, useRef } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { contentService } from '../../services/contentService';
import type { Tag } from '../../types';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export const TagSelector = ({ selectedTags, onTagsChange }: TagSelectorProps) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1'); // Default indigo color
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Predefined color palette
  const colorPalette = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];

  // Load available tags
  useEffect(() => {
    loadTags();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setIsCreatingTag(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTags = async () => {
    try {
      const tags = await contentService.getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await contentService.createTag({
        name: newTagName.trim(),
        color: newTagColor,
      });

      setAvailableTags([...availableTags, newTag]);
      onTagsChange([...selectedTags, newTag]);
      setNewTagName('');
      setIsCreatingTag(false);
      setSearchQuery('');
    } catch (error: any) {
      console.error('Error creating tag:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create tag. It may already exist.';
      alert(errorMessage);
    }
  };

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  // Filter available tags based on search query
  const filteredTags = availableTags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedTags.some((t) => t.id === tag.id)
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Tags</label>

      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
              color: tag.color || '#374151',
            }}
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:opacity-70"
              type="button"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Tag Input / Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
              setIsCreatingTag(false);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search or add tags..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {/* Existing Tags */}
            {filteredTags.length > 0 ? (
              <div className="py-1">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      handleToggleTag(tag);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span
                      className="inline-flex items-center gap-2 px-2 py-1 rounded text-sm"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : '#e5e7eb',
                        color: tag.color || '#374151',
                      }}
                    >
                      {tag.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Used {tag.usage_count} times
                    </span>
                  </button>
                ))}
              </div>
            ) : searchQuery && !isCreatingTag ? (
              <div className="py-2 px-4 text-sm text-gray-500">
                No matching tags found
              </div>
            ) : null}

            {/* Create New Tag Button */}
            {searchQuery && !isCreatingTag && (
              <div className="border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTag(true);
                    setNewTagName(searchQuery);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  Create tag "{searchQuery}"
                </button>
              </div>
            )}

            {/* Create Tag Form */}
            {isCreatingTag && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Tag Color
                  </label>
                  <div className="flex gap-2">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newTagColor === color ? 'border-gray-900' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                    className="flex-1 px-3 py-2 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create Tag
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingTag(false);
                      setNewTagName('');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Select existing tags or create new ones to categorize your content
      </p>
    </div>
  );
};
