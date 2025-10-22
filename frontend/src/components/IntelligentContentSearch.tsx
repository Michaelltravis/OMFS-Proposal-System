/**
 * Intelligent Content Search Component
 * AI-powered search across Content Library and Google Drive
 */
import React, { useState } from 'react';
import { Search, Loader2, ChevronDown, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { intelligentSearchService } from '../services/intelligentSearchService';
import type {
  IntelligentSearchResponse,
  LibraryResult,
  DriveResult,
  ContentChunk,
} from '../types';

interface IntelligentContentSearchProps {
  sectionType?: string;
  onAppendContent: (content: string, source: string) => void;
  onCleanup?: (content: string) => Promise<string>;
}

export const IntelligentContentSearch: React.FC<IntelligentContentSearchProps> = ({
  sectionType,
  onAppendContent,
  onCleanup,
}) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<IntelligentSearchResponse | null>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setSearching(true);
      const searchResults = await intelligentSearchService.search({
        query,
        section_type: sectionType,
        include_library: true,
        include_drive: true,
        max_results: 10,
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const toggleFileExpanded = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const handleAppendLibraryContent = (result: LibraryResult) => {
    onAppendContent(result.content, `Content Library: ${result.title}`);
  };

  const handleAppendChunk = (chunk: ContentChunk, fileName: string) => {
    onAppendContent(
      `<p>${chunk.text}</p>`,
      `Google Drive: ${fileName} (Chunk ${chunk.chunk_index + 1})`
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Describe what content you're looking for..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {searching ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Searching...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Search
            </>
          )}
        </button>
      </div>

      {/* Query Interpretation */}
      {results && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="font-medium text-blue-900">AI Interpretation:</div>
          <div className="text-blue-700 mt-1">{results.interpretation.intent}</div>
          {results.interpretation.keywords.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {results.interpretation.keywords.map((keyword, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="flex flex-col gap-6">
          {/* Content Library Results */}
          {results.library_results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  {results.library_results.length}
                </span>
                Content Library Results
              </h3>
              <div className="flex flex-col gap-2">
                {results.library_results.map((result) => (
                  <div
                    key={result.id}
                    className="border border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{result.title}</div>
                        {result.section_type && (
                          <div className="text-sm text-gray-500 mt-1">
                            Section: {result.section_type}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 mt-2 line-clamp-3">
                          {result.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500 mt-2">
                          {result.word_count && <span>{result.word_count} words</span>}
                          {result.quality_rating && (
                            <span>Quality: {result.quality_rating}/5</span>
                          )}
                          <span>Used {result.usage_count} times</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAppendLibraryContent(result)}
                        className="ml-4 p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        title="Append to editor"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google Drive Results */}
          {results.drive_results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {results.drive_results.length}
                </span>
                Google Drive Results
              </h3>
              <div className="flex flex-col gap-2">
                {results.drive_results.map((result) => (
                  <div
                    key={result.id}
                    className="border border-gray-300 rounded-lg overflow-hidden"
                  >
                    {/* File Header */}
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => toggleFileExpanded(result.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {expandedFiles.has(result.id) ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronRight size={20} />
                          )}
                        </button>
                        <div>
                          <div className="font-medium">{result.name}</div>
                          <div className="text-xs text-gray-500">
                            {result.has_content ? `${result.chunks.length} chunks available` : 'No content extracted'}
                          </div>
                        </div>
                      </div>
                      {result.web_view_link && (
                        <a
                          href={result.web_view_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Open in Drive
                        </a>
                      )}
                    </div>

                    {/* Expandable Chunks */}
                    {expandedFiles.has(result.id) && result.has_content && (
                      <div className="border-t border-gray-300">
                        {result.chunks.map((chunk) => (
                          <div
                            key={chunk.chunk_index}
                            className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-2">
                                  Chunk {chunk.chunk_index + 1}
                                </div>
                                {chunk.summary && (
                                  <div className="text-sm font-medium text-gray-700 mb-2">
                                    {chunk.summary}
                                  </div>
                                )}
                                <div className="text-sm text-gray-600 line-clamp-4">
                                  {chunk.text}
                                </div>
                                <div className="text-xs text-gray-400 mt-2">
                                  {chunk.length} characters
                                </div>
                              </div>
                              <button
                                onClick={() => handleAppendChunk(chunk, result.name)}
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                                title="Append to editor"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {results.library_results.length === 0 && results.drive_results.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No results found. Try a different search query.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
