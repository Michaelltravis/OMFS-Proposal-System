/**
 * Track Changes Panel - Shows pending changes and allows accept/reject
 */
import { Check, X, CheckCheck, XCircle, Clock, User } from 'lucide-react';
import type { TrackedChange } from '../types';

interface TrackChangesPanelProps {
  changes: TrackedChange[];
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const TrackChangesPanel = ({
  changes,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onRejectAll,
}: TrackChangesPanelProps) => {
  const pendingChanges = changes.filter((c) => c.status === 'pending');

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getChangeTypeLabel = (type: string) => {
    return type === 'insert' ? 'Insertion' : 'Deletion';
  };

  const getChangeTypeColor = (type: string) => {
    return type === 'insert' ? 'text-green-700' : 'text-red-700';
  };

  const getChangeTypeBgColor = (type: string) => {
    return type === 'insert' ? 'bg-green-50' : 'bg-red-50';
  };

  if (pendingChanges.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCheck className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Track Changes</h3>
        </div>
        <p className="text-sm text-gray-600">No pending changes to review.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Track Changes</h3>
          </div>
          <span className="text-sm text-gray-600">
            {pendingChanges.length} pending {pendingChanges.length === 1 ? 'change' : 'changes'}
          </span>
        </div>

        {/* Accept/Reject All Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onAcceptAll}
            disabled={pendingChanges.length === 0}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Accept All
          </button>
          <button
            onClick={onRejectAll}
            disabled={pendingChanges.length === 0}
            className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject All
          </button>
        </div>
      </div>

      {/* Changes List */}
      <div className="max-h-96 overflow-y-auto">
        {pendingChanges.map((change) => (
          <div
            key={change.id}
            className={`border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors ${getChangeTypeBgColor(
              change.type
            )}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Change Type Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      change.type === 'insert'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {getChangeTypeLabel(change.type)}
                  </span>
                </div>

                {/* User and Timestamp */}
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <User className="w-3 h-3" />
                  <span className="font-medium">{change.user}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(change.timestamp)}</span>
                </div>

                {/* Change ID (for reference) */}
                <div className="text-xs text-gray-400 font-mono truncate">
                  ID: {change.id}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => onAcceptChange(change.id)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  title="Accept change"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRejectChange(change.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Reject change"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
