import React, { useState, useEffect } from 'react';
import { X, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { RichTextEditor } from './common/RichTextEditor';
import { GoogleDriveSuggestions } from './GoogleDriveSuggestions';
import { GoogleDriveConnect } from './GoogleDriveConnect';
import { GoogleDriveFile } from '../types';

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
          showSuggestions && isGoogleDriveConnected ? 'max-w-7xl' : 'max-w-4xl'
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

              {isGoogleDriveConnected && (
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title={showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                >
                  {showSuggestions ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                </button>
              )}

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
              showSuggestions && isGoogleDriveConnected ? 'border-r border-gray-200' : ''
            }`}>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your content here..."
              />
            </div>

            {/* Google Drive Suggestions Panel */}
            {showSuggestions && isGoogleDriveConnected && (
              <div className="w-96 flex-shrink-0 overflow-y-auto p-6 bg-gray-50">
                <GoogleDriveSuggestions
                  sectionTitle={sectionTitle}
                  sectionType={sectionType}
                  onFileSelect={handleFileSelect}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
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
  );
};
