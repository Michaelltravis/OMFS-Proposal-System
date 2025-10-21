import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { contentService } from '../services/contentService';
import type { Tag } from '../types';

interface TagPickerProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}

export function TagPicker({ selectedTagIds, onChange }: TagPickerProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const tags = await contentService.getTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (tagName: string) => {
    if (!tagName.trim()) return;

    try {
      const newTag = await contentService.createTag({
        name: tagName.trim(),
        color: getRandomColor(),
      });
      setAvailableTags([...availableTags, newTag]);
      onChange([...selectedTagIds, newTag.id]);
      setSearchQuery('');
      setShowSuggestions(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag. It may already exist.');
    }
  };

  const addTag = (tagId: number) => {
    if (!selectedTagIds.includes(tagId)) {
      onChange([...selectedTagIds, tagId]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(0);
    inputRef.current?.focus();
  };

  const removeTag = (tagId: number) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const getRandomColor = () => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#06B6D4', // cyan
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const selectedTags = availableTags.filter((tag) =>
    selectedTagIds.includes(tag.id)
  );

  // Filter available tags that match search query and aren't already selected
  const filteredTags = availableTags.filter(
    (tag) =>
      !selectedTagIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if there's an exact match
  const exactMatch = filteredTags.find(
    (tag) => tag.name.toLowerCase() === searchQuery.toLowerCase()
  );

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
    setSelectedSuggestionIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredTags.length === 0) {
      // No suggestions shown or no matches
      if (e.key === 'Enter' && searchQuery.trim()) {
        e.preventDefault();
        // Create new tag
        handleCreateTag(searchQuery);
      }
      return;
    }

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        // Autocomplete with the first suggestion
        if (filteredTags.length > 0) {
          setSearchQuery(filteredTags[selectedSuggestionIndex].name);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredTags.length > 0) {
          // Add the selected suggestion
          addTag(filteredTags[selectedSuggestionIndex].id);
        } else if (searchQuery.trim()) {
          // Create new tag
          handleCreateTag(searchQuery);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredTags.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSearchQuery('');
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Tags</label>
        <div className="text-sm text-gray-500">Loading tags...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Tags</label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white"
              style={{ backgroundColor: tag.color || '#6B7280' }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="hover:bg-white/20 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Autocomplete Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type to search or create tags... (Tab to autocomplete, Enter to add)"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && searchQuery && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredTags.length > 0 ? (
              <>
                {filteredTags.map((tag, index) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTag(tag.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                      index === selectedSuggestionIndex
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || '#6B7280' }}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </button>
                ))}
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleCreateTag(searchQuery)}
                className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 text-left transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Create "{searchQuery}"</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Press Tab to autocomplete, Enter to add tag
      </p>
    </div>
  );
}
