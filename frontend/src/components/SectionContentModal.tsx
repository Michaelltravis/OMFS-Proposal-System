import React, { useState } from 'react';
import { X } from 'lucide-react';
import { RichTextEditor } from './common/RichTextEditor';

interface SectionContentModalProps {
  isOpen: boolean;
  sectionTitle: string;
  initialContent?: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

export const SectionContentModal: React.FC<SectionContentModalProps> = ({
  isOpen,
  sectionTitle,
  initialContent = '',
  onSave,
  onClose,
}) => {
  const [content, setContent] = useState(initialContent);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content);
    onClose();
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Section Content</h2>
              <p className="text-sm text-gray-600 mt-1">{sectionTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto p-6">
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your content here..."
            />
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
