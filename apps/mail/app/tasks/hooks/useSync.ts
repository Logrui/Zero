/**
 * useSync Hook
 * 
 * Custom hook for managing sync state and operations.
 * Handles sync status, statistics, and sync operations.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { syncService } from '../services/syncService';
import type {
    ConflictResolution,
    SyncStats,
    SyncStatus,
    UseSyncReturn
} from '../types/task';

export function useSync(): UseSyncReturn {
    const [status, setStatus] = useState<SyncStatus>({
        isOnline: navigator.onLine,
        lastSync: null,
        pendingChanges: 0,
        conflicts: 0,
        errors: []
    });
    const [stats, setStats] = useState<SyncStats>({
        totalTasks: 0,
        syncedTasks: 0,
        pendingChanges: 0,
        conflicts: 0,
        lastSync: null
    });

    // Update sync status
    const updateSyncStatus = useCallback(async () => {
        try {
            const newStatus = await syncService.getSyncStatus();
            setStatus(newStatus);
        } catch (error) {
            console.error('Failed to get sync status:', error);
        }
    }, []);

    // Update sync stats
    const updateSyncStats = useCallback(async () => {
        try {
            const newStats = await syncService.getSyncStats();
            setStats(newStats);
        } catch (error) {
            console.error('Failed to get sync stats:', error);
        }
    }, []);

    // Sync tasks
    const sync = useCallback(async () => {
        try {
            await syncService.sync();
            await updateSyncStatus();
            await updateSyncStats();
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        }
    }, [updateSyncStatus, updateSyncStats]);

    // Resolve conflicts
    const resolveConflicts = useCallback(async (resolutions: ConflictResolution[]) => {
        try {
            await syncService.resolveConflicts(resolutions);
            await updateSyncStatus();
            await updateSyncStats();
        } catch (error) {
            console.error('Failed to resolve conflicts:', error);
            throw error;
        }
    }, [updateSyncStatus, updateSyncStats]);

    // Force sync specific task
    const forceSync = useCallback(async (taskId: string) => {
        try {
            await syncService.forceSyncTask(taskId);
            await updateSyncStatus();
            await updateSyncStats();
        } catch (error) {
            console.error('Failed to force sync task:', error);
            throw error;
        }
    }, [updateSyncStatus, updateSyncStats]);

    // Process offline queue
    const processQueue = useCallback(async () => {
        try {
            await syncService.processOfflineQueue();
            await updateSyncStatus();
            await updateSyncStats();
        } catch (error) {
            console.error('Failed to process queue:', error);
            throw error;
        }
    }, [updateSyncStatus, updateSyncStats]);

    // Handle sync events
    useEffect(() => {
        const handleSyncStart = () => {
            setStatus(prev => ({ ...prev, errors: [] }));
        };

        const handleSyncComplete = () => {
            updateSyncStatus();
            updateSyncStats();
        };

        const handleSyncError = (event: any) => {
            setStatus(prev => ({
                ...prev,
                errors: [...prev.errors, event.data.error]
            }));
        };

        const handleOfflineChange = () => {
            updateSyncStatus();
            updateSyncStats();
        };

        // Add event listeners
        syncService.addEventListener('sync_start', handleSyncStart);
        syncService.addEventListener('sync_complete', handleSyncComplete);
        syncService.addEventListener('sync_error', handleSyncError);
        syncService.addEventListener('offline_change', handleOfflineChange);

        // Initial status update
        updateSyncStatus();
        updateSyncStats();

        // Cleanup
        return () => {
            syncService.removeEventListener('sync_start', handleSyncStart);
            syncService.removeEventListener('sync_complete', handleSyncComplete);
            syncService.removeEventListener('sync_error', handleSyncError);
            syncService.removeEventListener('offline_change', handleOfflineChange);
        };
    }, [updateSyncStatus, updateSyncStats]);

    // Handle online/offline changes
    useEffect(() => {
        const handleOnline = () => {
            setStatus(prev => ({ ...prev, isOnline: true }));
            sync(); // Auto-sync when coming back online
        };

        const handleOffline = () => {
            setStatus(prev => ({ ...prev, isOnline: false }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [sync]);

    // Start auto-sync
    useEffect(() => {
        syncService.startAutoSync();
        return () => syncService.stopAutoSync();
    }, []);

    return {
        status,
        stats,
        sync,
        resolveConflicts,
        forceSync,
        processQueue
    };
}
