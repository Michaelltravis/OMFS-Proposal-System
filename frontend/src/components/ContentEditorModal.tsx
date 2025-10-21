/**
 * Content Editor Modal - Create and edit content blocks with Claude AI assistance
 */
import { useState } from 'react';
import { X, Sparkles, Loader2, Save, GitBranch } from 'lucide-react';
import { RichTextEditor } from './common/RichTextEditor';
import { TrackChangesPanel } from './TrackChangesPanel';
import { contentService } from '../services/contentService';
import type { ContentBlock, TrackedChange } from '../types';

interface ContentEditorModalProps {
  block?: ContentBlock | null;
  onClose: () => void;
  onSave: () => void;
}

export const ContentEditorModal = ({ block, onClose, onSave }: ContentEditorModalProps) => {
  const [title, setTitle] = useState(block?.title || '');
  const [sectionType, setSectionType] = useState(block?.section_type || 'technical_approach');
  const [content, setContent] = useState(block?.content || '');
  const [claudePrompt, setClaudePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showClaudePanel, setShowClaudePanel] = useState(false);

  // Track Changes state
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(block?.track_changes_enabled || false);
  const [trackedChanges, setTrackedChanges] = useState<TrackedChange[]>(
    block?.tracked_changes_metadata?.changes || []
  );
  const [currentUser] = useState({ name: 'Current User', id: 'user@example.com' });

  const sectionTypes = [
    { value: 'technical_approach', label: 'Technical Approach' },
    { value: 'past_performance', label: 'Past Performance' },
    { value: 'executive_summary', label: 'Executive Summary' },
    { value: 'qualifications', label: 'Qualifications' },
    { value: 'pricing', label: 'Pricing' },
  ];

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const data = {
        title,
        section_type: sectionType,
        content,
        quality_rating: block?.quality_rating || 3.0,
        track_changes_enabled: trackChangesEnabled,
        tracked_changes_metadata: {
          changes: trackedChanges,
        },
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

  const handleToggleTrackChanges = async () => {
    if (!block?.id) {
      // For new blocks, just toggle locally
      setTrackChangesEnabled(!trackChangesEnabled);
      if (!trackChangesEnabled) {
        setTrackedChanges([]);
      }
      return;
    }

    try {
      const response = await contentService.toggleTrackChanges(block.id, !trackChangesEnabled);
      setTrackChangesEnabled(response.track_changes_enabled || false);
      if (!response.track_changes_enabled) {
        setTrackedChanges([]);
      }
    } catch (error) {
      console.error('Error toggling track changes:', error);
      alert('Failed to toggle track changes. Please try again.');
    }
  };

  const handleTrackChange = (
    changeId: string,
    changeType: 'insert' | 'delete',
    user: string,
    userId: string,
    timestamp: string
  ) => {
    const newChange: TrackedChange = {
      id: changeId,
      type: changeType,
      user,
      user_id: userId,
      timestamp,
      status: 'pending',
    };
    setTrackedChanges((prev) => [...prev, newChange]);
  };

  const handleAcceptChange = async (changeId: string) => {
    if (!block?.id) {
      // For new blocks, just remove from local state
      setTrackedChanges((prev) => prev.filter((c) => c.id !== changeId));
      return;
    }

    try {
      const response = await contentService.acceptRejectChanges(block.id, [changeId], 'accept');
      setContent(response.content);
      setTrackedChanges(response.tracked_changes_metadata.changes);
    } catch (error) {
      console.error('Error accepting change:', error);
      alert('Failed to accept change. Please try again.');
    }
  };

  const handleRejectChange = async (changeId: string) => {
    if (!block?.id) {
      // For new blocks, just remove from local state
      setTrackedChanges((prev) => prev.filter((c) => c.id !== changeId));
      return;
    }

    try {
      const response = await contentService.acceptRejectChanges(block.id, [changeId], 'reject');
      setContent(response.content);
      setTrackedChanges(response.tracked_changes_metadata.changes);
    } catch (error) {
      console.error('Error rejecting change:', error);
      alert('Failed to reject change. Please try again.');
    }
  };

  const handleAcceptAll = async () => {
    const pendingChangeIds = trackedChanges.filter((c) => c.status === 'pending').map((c) => c.id);
    if (pendingChangeIds.length === 0) return;

    if (!block?.id) {
      setTrackedChanges([]);
      return;
    }

    try {
      const response = await contentService.acceptRejectChanges(block.id, pendingChangeIds, 'accept');
      setContent(response.content);
      setTrackedChanges(response.tracked_changes_metadata.changes);
    } catch (error) {
      console.error('Error accepting all changes:', error);
      alert('Failed to accept all changes. Please try again.');
    }
  };

  const handleRejectAll = async () => {
    const pendingChangeIds = trackedChanges.filter((c) => c.status === 'pending').map((c) => c.id);
    if (pendingChangeIds.length === 0) return;

    if (!block?.id) {
      setTrackedChanges([]);
      return;
    }

    try {
      const response = await contentService.acceptRejectChanges(block.id, pendingChangeIds, 'reject');
      setContent(response.content);
      setTrackedChanges(response.tracked_changes_metadata.changes);
    } catch (error) {
      console.error('Error rejecting all changes:', error);
      alert('Failed to reject all changes. Please try again.');
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
          {/* Track Changes Toggle */}
          <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Track Changes</span>
              {trackChangesEnabled && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
            <button
              onClick={handleToggleTrackChanges}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                trackChangesEnabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {trackChangesEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

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
                  trackChangesEnabled={trackChangesEnabled}
                  currentUser={currentUser}
                  onTrackChange={handleTrackChange}
                />
              </div>

              {/* Track Changes Panel */}
              {trackChangesEnabled && trackedChanges.length > 0 && (
                <div>
                  <TrackChangesPanel
                    changes={trackedChanges}
                    onAcceptChange={handleAcceptChange}
                    onRejectChange={handleRejectChange}
                    onAcceptAll={handleAcceptAll}
                    onRejectAll={handleRejectAll}
                  />
                </div>
              )}
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
