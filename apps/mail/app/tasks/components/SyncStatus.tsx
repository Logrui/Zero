/**
 * Sync Status Component
 * 
 * Displays sync status, statistics, and controls.
 * Shows online/offline status, pending changes, and sync actions.
 */

'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { SyncStats, SyncStatus } from '../types/task';

export interface SyncStatusProps {
    status: SyncStatus;
    stats: SyncStats;
    onSync: () => void;
    onProcessQueue: () => void;
    onForceSync: (taskId: string) => void;
    onResolveConflicts: (resolutions: any[]) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function SyncStatus({
    status,
    stats,
    onSync,
    onProcessQueue,
    onForceSync,
    onResolveConflicts,
    onRefresh,
    isRefreshing = false
}: SyncStatusProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Handle sync
    const handleSync = useCallback(() => {
        onSync();
    }, [onSync]);

    // Handle process queue
    const handleProcessQueue = useCallback(() => {
        onProcessQueue();
    }, [onProcessQueue]);

    // Get status color
    const getStatusColor = useCallback(() => {
        if (!status.isOnline) return 'text-red-600';
        if (status.pendingChanges > 0) return 'text-yellow-600';
        if (status.conflicts > 0) return 'text-orange-600';
        return 'text-green-600';
    }, [status]);

    // Get status icon
    const getStatusIcon = useCallback(() => {
        if (!status.isOnline) return '🔴';
        if (status.pendingChanges > 0) return '🟡';
        if (status.conflicts > 0) return '🟠';
        return '🟢';
    }, [status]);

    // Get status text
    const getStatusText = useCallback(() => {
        if (!status.isOnline) return 'Offline';
        if (status.pendingChanges > 0) return `${status.pendingChanges} pending`;
        if (status.conflicts > 0) return `${status.conflicts} conflicts`;
        return 'Synced';
    }, [status]);

    // Format last sync time
    const formatLastSync = useCallback(() => {
        if (!status.lastSync) return 'Never';
        const now = new Date();
        const lastSync = new Date(status.lastSync);
        const diffMs = now.getTime() - lastSync.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return lastSync.toLocaleDateString();
    }, [status.lastSync]);

    return (
        <div className="relative flex items-center space-x-2">
            {/* Status Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
          flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
          ${getStatusColor()} bg-white border border-gray-300 hover:bg-gray-50
        `}
            >
                <span>{getStatusIcon()}</span>
                <span>{getStatusText()}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Refresh Button */}
            {onRefresh && (
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                </button>
            )}

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-4 space-y-4">
                        {/* Status Overview */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-900">Sync Status</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className={`text-sm font-medium ${getStatusColor()}`}>
                                    {getStatusText()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Last sync:</span>
                                <span className="text-sm text-gray-900">{formatLastSync()}</span>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-900">Statistics</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Total tasks:</span>
                                    <span className="ml-2 font-medium">{stats.totalTasks}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Synced:</span>
                                    <span className="ml-2 font-medium">{stats.syncedTasks}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Pending:</span>
                                    <span className="ml-2 font-medium">{stats.pendingChanges}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Conflicts:</span>
                                    <span className="ml-2 font-medium">{stats.conflicts}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-900">Actions</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={handleSync}
                                    disabled={!status.isOnline}
                                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sync Now
                                </button>

                                {status.pendingChanges > 0 && (
                                    <button
                                        onClick={handleProcessQueue}
                                        className="w-full px-3 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                                    >
                                        Process Queue ({status.pendingChanges})
                                    </button>
                                )}

                                {status.conflicts > 0 && (
                                    <button
                                        onClick={() => onResolveConflicts([])}
                                        className="w-full px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
                                    >
                                        Resolve Conflicts ({status.conflicts})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Errors */}
                        {status.errors.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-gray-900">Errors</h3>
                                <div className="space-y-1">
                                    {status.errors.map((error, index) => (
                                        <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                            {error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
