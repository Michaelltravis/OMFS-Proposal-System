/**
 * Linked Content Item - Display a content block linked to a proposal section
 */
import { useState } from 'react';
import { Link2, Trash2, Edit3, Sparkles, GripVertical, FileText } from 'lucide-react';
import type { ProposalContent } from '../types';

interface LinkedContentItemProps {
  content: ProposalContent;
  onEdit: (content: ProposalContent) => void;
  onRefine: (content: ProposalContent) => void;
  onDelete: (contentId: number) => void;
  isCustom?: boolean;
}

export const LinkedContentItem = ({
  content,
  onEdit,
  onRefine,
  onDelete,
  isCustom = false,
}: LinkedContentItemProps) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const truncateContent = (html: string, maxLength: number = 300) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="group border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-all bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
          <div className="flex items-center gap-2 flex-1">
            {isCustom ? (
              <FileText className="w-4 h-4 text-green-600" />
            ) : (
              <Link2 className="w-4 h-4 text-blue-600" />
            )}
            {content.title ? (
              <h3 className="text-lg font-medium text-gray-900">{content.title}</h3>
            ) : (
              <h3 className="text-lg font-medium text-gray-500 italic">Untitled Content</h3>
            )}
            {!isCustom && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                From Repository
              </span>
            )}
            {isCustom && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                Custom Content
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onRefine(content)}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="Refine with Claude AI"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => onEdit(content)}
            className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
            title="Edit content"
          >
            <Edit3 className="w-4 h-4 text-yellow-600" />
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to remove this content from the section?')) {
                onDelete(content.id);
              }
            }}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            title="Remove from section"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {showFullContent ? (
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        ) : (
          <div className="text-gray-600 text-sm">
            {truncateContent(content.content)}
          </div>
        )}

        {/* Toggle Button */}
        {content.content.length > 300 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showFullContent ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {content.word_count && (
            <span>{content.word_count} words</span>
          )}
          {content.estimated_pages && (
            <span>~{content.estimated_pages} pages</span>
          )}
          {content.customization_notes && (
            <span className="text-yellow-600">
              Customized: {content.customization_notes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
