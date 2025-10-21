/**
 * Version Compare Component - Side-by-side comparison of content versions
 */
import { X, ArrowLeft } from 'lucide-react';
import type { ContentVersion } from '../types';

interface VersionCompareProps {
  currentTitle: string;
  currentContent: string;
  version: ContentVersion;
  onClose: () => void;
}

export const VersionCompare = ({ currentTitle, currentContent, version, onClose }: VersionCompareProps) => {
  // Helper to strip HTML and get text for word count
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const currentWordCount = stripHtml(currentContent).split(/\s+/).filter(Boolean).length;
  const versionWordCount = stripHtml(version.content).split(/\s+/).filter(Boolean).length;
  const wordCountDiff = currentWordCount - versionWordCount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            title="Back to version history"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="font-semibold text-gray-900">
            Comparing: Current vs Version {version.version_number}
          </h3>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-600 font-medium mb-1">Version</div>
          <div className="text-gray-900">Version {version.version_number}</div>
        </div>
        <div>
          <div className="text-gray-600 font-medium mb-1">Created</div>
          <div className="text-gray-900">
            {new Date(version.created_at).toLocaleDateString()} {new Date(version.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div>
          <div className="text-gray-600 font-medium mb-1">Word Count Difference</div>
          <div className={`font-semibold ${wordCountDiff > 0 ? 'text-green-600' : wordCountDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {wordCountDiff > 0 ? '+' : ''}{wordCountDiff} words
          </div>
        </div>
      </div>

      {/* Change Description */}
      {version.change_description && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-700 mb-1">Change Description</div>
          <div className="text-sm text-gray-900">{version.change_description}</div>
        </div>
      )}

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Version */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-green-100 border-b border-green-200 px-4 py-2">
            <div className="font-semibold text-green-900">Current Version</div>
            <div className="text-sm text-green-700">{currentWordCount} words</div>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            <h4 className="text-lg font-semibold mb-3 text-gray-900">{currentTitle}</h4>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: currentContent }}
            />
          </div>
        </div>

        {/* Historical Version */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-red-100 border-b border-red-200 px-4 py-2">
            <div className="font-semibold text-red-900">Version {version.version_number}</div>
            <div className="text-sm text-red-700">{versionWordCount} words</div>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            <h4 className="text-lg font-semibold mb-3 text-gray-900">{version.title}</h4>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: version.content }}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded p-3 border border-gray-200">
        <strong>Note:</strong> Green indicates the current version, red indicates version {version.version_number}.
        Review both versions and use the "Revert" button in the version history if you want to restore the older version.
      </div>
    </div>
  );
};
