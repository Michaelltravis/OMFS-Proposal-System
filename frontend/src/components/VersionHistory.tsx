/**
 * Version History Component - Display and manage content block versions
 */
import { useState, useEffect } from 'react';
import { History, RotateCcw, Save, Clock, User, GitCompare, Loader2 } from 'lucide-react';
import { contentService } from '../services/contentService';
import type { ContentVersion } from '../types';
import { VersionCompare } from './VersionCompare';

interface VersionHistoryProps {
  blockId: number;
  currentTitle: string;
  currentContent: string;
  onRevert: (version: ContentVersion) => void;
}

export const VersionHistory = ({ blockId, currentTitle, currentContent, onRevert }: VersionHistoryProps) => {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReverting, setIsReverting] = useState<number | null>(null);
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false);
  const [checkpointDescription, setCheckpointDescription] = useState('');
  const [showCheckpointForm, setShowCheckpointForm] = useState(false);
  const [compareVersion, setCompareVersion] = useState<ContentVersion | null>(null);

  useEffect(() => {
    loadVersions();
  }, [blockId]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const data = await contentService.getVersions(blockId);
      setVersions(data);
    } catch (error) {
      console.error('Error loading versions:', error);
      alert('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (version: ContentVersion) => {
    if (!confirm(`Are you sure you want to revert to version ${version.version_number}? The current version will be saved before reverting.`)) {
      return;
    }

    try {
      setIsReverting(version.id);
      await contentService.revertToVersion(blockId, version.id);
      onRevert(version);
      await loadVersions(); // Reload to show new version created during revert
      alert('Successfully reverted to selected version');
    } catch (error) {
      console.error('Error reverting version:', error);
      alert('Failed to revert to version');
    } finally {
      setIsReverting(null);
    }
  };

  const handleSaveCheckpoint = async () => {
    if (!checkpointDescription.trim()) {
      alert('Please enter a description for this checkpoint');
      return;
    }

    try {
      setIsSavingCheckpoint(true);
      await contentService.createVersion(blockId, {
        change_description: checkpointDescription,
        created_by: 'User', // TODO: Get from auth context
      });
      setCheckpointDescription('');
      setShowCheckpointForm(false);
      await loadVersions();
      alert('Checkpoint saved successfully');
    } catch (error) {
      console.error('Error saving checkpoint:', error);
      alert('Failed to save checkpoint');
    } finally {
      setIsSavingCheckpoint(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (compareVersion) {
    return (
      <VersionCompare
        currentTitle={currentTitle}
        currentContent={currentContent}
        version={compareVersion}
        onClose={() => setCompareVersion(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Version History</h3>
          <span className="text-sm text-gray-500">({versions.length} versions)</span>
        </div>
        <button
          onClick={() => setShowCheckpointForm(!showCheckpointForm)}
          className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-1"
        >
          <Save className="w-4 h-4" />
          Save Checkpoint
        </button>
      </div>

      {/* Checkpoint Form */}
      {showCheckpointForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Checkpoint Description
            </label>
            <input
              type="text"
              value={checkpointDescription}
              onChange={(e) => setCheckpointDescription(e.target.value)}
              placeholder="e.g., Before major refactoring, Ready for review..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveCheckpoint}
              disabled={isSavingCheckpoint || !checkpointDescription.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSavingCheckpoint ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowCheckpointForm(false);
                setCheckpointDescription('');
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Version List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No version history yet</p>
            <p className="text-sm">Versions will be created when you save changes</p>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Version Number */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      Version {version.version_number}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Latest
                      </span>
                    )}
                  </div>

                  {/* Change Description */}
                  {version.change_description && (
                    <p className="text-sm text-gray-700 mb-2">
                      {version.change_description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(version.created_at)}
                    </div>
                    {version.created_by && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.created_by}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setCompareVersion(version)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 flex items-center gap-1"
                    title="Compare with current"
                  >
                    <GitCompare className="w-4 h-4" />
                    Compare
                  </button>
                  {index !== 0 && (
                    <button
                      onClick={() => handleRevert(version)}
                      disabled={isReverting !== null}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isReverting === version.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Reverting...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Revert
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
