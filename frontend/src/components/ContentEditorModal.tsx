/**
 * Content Editor Modal - Create and edit content blocks with Claude AI assistance
 */
import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Save, Plus, Tag as TagIcon } from 'lucide-react';
import { RichTextEditor } from './common/RichTextEditor';
import { TagPicker } from './TagPicker';
import { contentService } from '../services/contentService';
import type { ContentBlock, SectionType } from '../types';

interface ContentEditorModalProps {
  block?: ContentBlock | null;
  onClose: () => void;
  onSave: () => void;
}

export const ContentEditorModal = ({ block, onClose, onSave }: ContentEditorModalProps) => {
  const [title, setTitle] = useState(block?.title || '');
  const [sectionType, setSectionType] = useState(block?.section_type || 'technical_approach');
  const [content, setContent] = useState(block?.content || '');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    block?.tags?.map((tag) => tag.id) || []
  );
  const [claudePrompt, setClaudePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showClaudePanel, setShowClaudePanel] = useState(false);
  const [availableSectionTypes, setAvailableSectionTypes] = useState<SectionType[]>([]);
  const [selectedSectionTypeIds, setSelectedSectionTypeIds] = useState<number[]>(
    block?.section_types?.map(st => st.id) || []
  );
  const [showNewSectionTypeForm, setShowNewSectionTypeForm] = useState(false);
  const [newSectionTypeName, setNewSectionTypeName] = useState('');
  const [newSectionTypeDisplayName, setNewSectionTypeDisplayName] = useState('');
  const [newSectionTypeDescription, setNewSectionTypeDescription] = useState('');

  const sectionTypes = [
    { value: 'technical_approach', label: 'Technical Approach' },
    { value: 'past_performance', label: 'Past Performance' },
    { value: 'executive_summary', label: 'Executive Summary' },
    { value: 'qualifications', label: 'Qualifications' },
    { value: 'pricing', label: 'Pricing' },
  ];

  useEffect(() => {
    fetchSectionTypes();
  }, []);

  const fetchSectionTypes = async () => {
    try {
      const sectionTypes = await contentService.getSectionTypes();
      setAvailableSectionTypes(sectionTypes);
    } catch (error) {
      console.error('Error fetching section types:', error);
    }
  };

  const toggleSectionType = (sectionTypeId: number) => {
    setSelectedSectionTypeIds((prev) =>
      prev.includes(sectionTypeId)
        ? prev.filter((id) => id !== sectionTypeId)
        : [...prev, sectionTypeId]
    );
  };

  const handleCreateNewSectionType = async () => {
    if (!newSectionTypeName.trim() || !newSectionTypeDisplayName.trim()) {
      alert('Please enter both name and display name for the section type.');
      return;
    }

    try {
      const newSectionType = await contentService.createSectionType({
        name: newSectionTypeName.toLowerCase().replace(/\s+/g, '_'),
        display_name: newSectionTypeDisplayName,
        description: newSectionTypeDescription || undefined,
        color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
      });

      setAvailableSectionTypes([...availableSectionTypes, newSectionType]);
      setSelectedSectionTypeIds([...selectedSectionTypeIds, newSectionType.id]);
      setShowNewSectionTypeForm(false);
      setNewSectionTypeName('');
      setNewSectionTypeDisplayName('');
      setNewSectionTypeDescription('');
    } catch (error) {
      console.error('Error creating section type:', error);
      alert('Failed to create section type. It may already exist.');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const data = {
        title,
        section_type: sectionType,
        content,
        quality_rating: block?.quality_rating || 3.0,
        tag_ids: selectedTagIds,
        section_type_ids: selectedSectionTypeIds,
      };

      if (block?.id) {
        // Update existing block
        await contentService.updateContentBlock(block.id, data);
      } else {
        // Create new block
        await contentService.createContentBlock(data);
      }

      onSave();
    } catch (error) {
      console.error('Error saving content block:', error);
      alert('Failed to save content block. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateWithClaude = async (action: 'draft' | 'improve' | 'expand') => {
    if (!claudePrompt.trim() && action === 'draft') {
      alert('Please enter a prompt for Claude to draft content.');
      return;
    }

    if (!content.trim() && action !== 'draft') {
      alert('Please add some content first.');
      return;
    }

    try {
      setIsGenerating(true);

      // Call Claude AI backend
      const response = await contentService.generateContentWithAI({
        action,
        section_type: sectionType,
        prompt: claudePrompt,
        existing_content: action !== 'draft' ? content : undefined,
      });

      // Update the content with AI-generated content
      setContent(response.content);

    } catch (error: any) {
      console.error('Error generating with Claude:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to generate content with Claude. Please try again.';
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {block ? 'Edit Content Block' : 'Create New Content Block'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Editor - Left 2/3 */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content block title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Section Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Type *
                </label>
                <select
                  value={sectionType}
                  onChange={(e) => setSectionType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {sectionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Type Labels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Section Type Labels
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewSectionTypeForm(!showNewSectionTypeForm)}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Create New
                  </button>
                </div>

                {/* New Section Type Form */}
                {showNewSectionTypeForm && (
                  <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                    <input
                      type="text"
                      value={newSectionTypeDisplayName}
                      onChange={(e) => setNewSectionTypeDisplayName(e.target.value)}
                      placeholder="Display Name (e.g., Technical Approach)"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      value={newSectionTypeName}
                      onChange={(e) => setNewSectionTypeName(e.target.value)}
                      placeholder="Name (e.g., technical_approach)"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <textarea
                      value={newSectionTypeDescription}
                      onChange={(e) => setNewSectionTypeDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateNewSectionType}
                        className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewSectionTypeForm(false)}
                        className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Section Type Selection */}
                <div className="flex flex-wrap gap-2">
                  {availableSectionTypes.map((st) => {
                    const isSelected = selectedSectionTypeIds.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => toggleSectionType(st.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isSelected
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={{
                          backgroundColor: isSelected ? st.color : undefined,
                        }}
                        title={st.description}
                      >
                        <TagIcon className="w-3 h-3" />
                        {st.display_name}
                      </button>
                    );
                  })}
                </div>

                {availableSectionTypes.length === 0 && (
                  <p className="text-sm text-gray-500 italic">
                    No section types available. Create one above.
                  </p>
                )}
              </div>

              {/* Tags */}
              <TagPicker selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start typing or use Claude AI to draft content..."
                  editable={true}
                />
              </div>
            </div>

            {/* Claude AI Panel - Right 1/3 */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 sticky top-0">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Claude AI Assistant</h3>
                </div>

                <div className="space-y-4">
                  {/* Prompt Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt / Instructions
                    </label>
                    <textarea
                      value={claudePrompt}
                      onChange={(e) => setClaudePrompt(e.target.value)}
                      placeholder="Describe what you need or how to improve..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>

                  {/* AI Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleGenerateWithClaude('draft')}
                      disabled={isGenerating || !claudePrompt.trim()}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Draft Content
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleGenerateWithClaude('improve')}
                      disabled={isGenerating || !content.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Improving...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Improve Content
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleGenerateWithClaude('expand')}
                      disabled={isGenerating || !content.trim()}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Expanding...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Expand Content
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Tips */}
                  <div className="text-xs text-gray-600 bg-white bg-opacity-50 rounded p-3 space-y-1">
                    <p className="font-medium">Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Be specific in your prompts</li>
                      <li>Mention target audience</li>
                      <li>Include technical details</li>
                      <li>Reference similar projects</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || isSaving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {block ? 'Update' : 'Create'} Content Block
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
