/**
 * Google Drive Suggestions Component
 * Displays suggested files from Google Drive based on section context
 */
import React, { useState, useEffect } from 'react';
import { Search, FileText, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import googleDriveService from '../services/googleDriveService';
import { GoogleDriveFile } from '../types';

interface GoogleDriveSuggestionsProps {
  sectionTitle: string;
  sectionType?: string;
  onFileSelect?: (file: GoogleDriveFile) => void;
}

export const GoogleDriveSuggestions: React.FC<GoogleDriveSuggestionsProps> = ({
  sectionTitle,
  sectionType,
  onFileSelect,
}) => {
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Auto-search based on section title when component mounts
    if (sectionTitle) {
      handleSearch(sectionTitle);
    }
  }, [sectionTitle]);

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery || sectionTitle;
    if (!searchTerm) return;

    try {
      setLoading(true);
      setError(null);
      const response = await googleDriveService.searchFiles({
        query: searchTerm,
        section_type: sectionType,
        max_results: 10,
      });
      setFiles(response.files);
    } catch (err: any) {
      console.error('Error searching Google Drive:', err);
      setError(err.message || 'Failed to search Google Drive. Please make sure you are connected.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Google Drive Suggestions
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Find relevant content from your Google Drive for "{sectionTitle}"
        </p>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search Google Drive..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600">
              {error ? 'Unable to load suggestions' : 'No files found. Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => onFileSelect?.(file)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {file.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {file.modified_time && (
                          <span>{formatDate(file.modified_time)}</span>
                        )}
                        {file.size && (
                          <span>{formatFileSize(file.size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {file.web_view_link && (
                    <a
                      href={file.web_view_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
