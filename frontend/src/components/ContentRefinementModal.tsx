/**
 * Content Refinement Modal - Use Claude AI to improve or expand content
 */
import { useState } from 'react';
import { X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { contentService } from '../services/contentService';
import type { ProposalContent } from '../types';

interface ContentRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ProposalContent;
  sectionType?: string;
  onApply: (refinedContent: string, customizationNotes: string) => void;
}

export const ContentRefinementModal = ({
  isOpen,
  onClose,
  content,
  sectionType,
  onApply,
}: ContentRefinementModalProps) => {
  const [action, setAction] = useState<'improve' | 'expand'>('improve');
  const [prompt, setPrompt] = useState('');
  const [refinedContent, setRefinedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please provide instructions for how to refine the content');
      return;
    }

    try {
      setIsGenerating(true);
      setError('');

      const response = await contentService.generateContentWithAI({
        action,
        section_type: sectionType || 'general',
        prompt,
        existing_content: content.content,
      });

      setRefinedContent(response.data.content);
    } catch (err: any) {
      console.error('Error generating content:', err);
      setError(err.response?.data?.detail || 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (refinedContent) {
      const customizationNote = `${action === 'improve' ? 'Improved' : 'Expanded'} with Claude: ${prompt}`;
      onApply(refinedContent, customizationNote);
      handleClose();
    }
  };

  const handleClose = () => {
    setAction('improve');
    setPrompt('');
    setRefinedContent('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Refine Content with Claude</h2>
              <p className="text-sm text-gray-600 mt-1">
                Use AI to improve or expand your content
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Original Content */}
          <div className="w-1/2 border-r border-gray-200 overflow-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Content</h3>
            {content.title && (
              <h4 className="text-md font-medium text-gray-700 mb-3">{content.title}</h4>
            )}
            <div
              className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />

            {/* Action Selection */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Refinement Action
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAction('improve')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    action === 'improve'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Improve</div>
                  <div className="text-xs">Enhance clarity, flow, and quality</div>
                </button>
                <button
                  onClick={() => setAction('expand')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    action === 'expand'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Expand</div>
                  <div className="text-xs">Add more detail and depth</div>
                </button>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instructions for Claude
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  action === 'improve'
                    ? 'Example: Make the language more concise and professional. Focus on measurable outcomes.'
                    : 'Example: Add more technical details about implementation approach. Include specific technologies.'
                }
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating with Claude...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Refined Content</span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Refined Content */}
          <div className="w-1/2 overflow-auto p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Refined Content
              {refinedContent && (
                <CheckCircle2 className="inline-block w-5 h-5 text-green-600 ml-2" />
              )}
            </h3>

            {refinedContent ? (
              <div>
                <div
                  className="prose prose-sm max-w-none bg-white rounded-lg p-4 shadow-sm"
                  dangerouslySetInnerHTML={{ __html: refinedContent }}
                />

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Preview:</strong> Review the refined content above. Click "Apply Changes"
                    to update the proposal section with this content.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Sparkles className="w-12 h-12 mb-3" />
                <p className="text-lg font-medium mb-2">No refined content yet</p>
                <p className="text-sm text-center">
                  Provide instructions and click "Generate Refined Content"
                  <br />
                  to see the AI-improved version here
                </p>
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
            onClick={handleApply}
            disabled={!refinedContent}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
