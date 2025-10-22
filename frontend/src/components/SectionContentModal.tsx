import React, { useState, useEffect } from 'react';
import { X, PanelRightClose, PanelRightOpen, Sparkles, Loader2 } from 'lucide-react';
import { RichTextEditor } from './common/RichTextEditor';
import { GoogleDriveSuggestions } from './GoogleDriveSuggestions';
import { GoogleDriveConnect } from './GoogleDriveConnect';
import { IntelligentContentSearch } from './IntelligentContentSearch';
import { intelligentSearchService } from '../services/intelligentSearchService';
import type { GoogleDriveFile } from '../types';

interface SectionContentModalProps {
  isOpen: boolean;
  sectionTitle: string;
  sectionType?: string;
  initialContent?: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

export const SectionContentModal: React.FC<SectionContentModalProps> = ({
  isOpen,
  sectionTitle,
  sectionType,
  initialContent = '',
  onSave,
  onClose,
}) => {
  const [content, setContent] = useState(initialContent);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [useIntelligentSearch, setUseIntelligentSearch] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  const handleFileSelect = (file: GoogleDriveFile) => {
    // You could implement functionality to insert file content or reference
    console.log('Selected file:', file);
    if (file.web_view_link) {
      const link = `<p><a href="${file.web_view_link}" target="_blank">${file.name}</a></p>`;
      setContent(content + link);
    }
  };

  const handleAppendContent = (newContent: string, source: string) => {
    // Append content with source attribution
    const attribution = `\n<!-- Source: ${source} -->\n`;
    setContent(content + attribution + newContent + '\n');
  };

  const handleCleanup = async () => {
    if (!content.trim()) {
      alert('No content to clean up');
      return;
    }

    try {
      setIsCleaningUp(true);
      const result = await intelligentSearchService.cleanupContent(content);
      setContent(result.cleaned);
      alert('Content has been cleaned up and polished!');
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Failed to clean up content. Please try again.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`relative bg-white rounded-lg shadow-xl w-full max-h-[90vh] flex flex-col transition-all ${
          showSuggestions ? 'max-w-7xl' : 'max-w-4xl'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Edit Section Content</h2>
              <p className="text-sm text-gray-600 mt-1">{sectionTitle}</p>
            </div>

            {/* Google Drive Connection & Toggle */}
            <div className="flex items-center gap-3">
              <GoogleDriveConnect onStatusChange={setIsGoogleDriveConnected} />

              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title={showSuggestions ? 'Hide search panel' : 'Show search panel'}
              >
                {showSuggestions ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
              </button>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-hidden flex">
            {/* Editor */}
            <div className={`flex-grow overflow-y-auto p-6 ${
              showSuggestions ? 'border-r border-gray-200' : ''
            }`}>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your content here..."
              />
            </div>

            {/* Content Search Panel */}
            {showSuggestions && (
              <div className="w-[500px] flex-shrink-0 overflow-y-auto p-6 bg-gray-50">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Content Search</h3>
                  <p className="text-xs text-gray-600">
                    Search for relevant content from the Content Library and Google Drive
                  </p>
                </div>
                <IntelligentContentSearch
                  sectionType={sectionType}
                  onAppendContent={handleAppendContent}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={handleCleanup}
              disabled={isCleaningUp || !content.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Clean up and polish content with AI"
            >
              {isCleaningUp ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Cleaning...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Clean Up with Claude
                </>
              )}
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Content
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
