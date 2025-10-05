/**
 * useSync Hook
 * 
 * Custom hook for managing sync state and operations.
 * Handles sync status, statistics, and sync operations.
 * Updated to use TRPC instead of REST API.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { getSyncStatus, syncWithGoogleTasks } from '../../../modules/tasks/lib/tasks';
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
        console.log('🔍 [useSync.updateSyncStatus] Starting sync status update');
        try {
            console.log('🌐 [useSync.updateSyncStatus] Calling getSyncStatus()');
            const newStatus = await getSyncStatus();
            console.log('✅ [useSync.updateSyncStatus] Sync status received:', newStatus);
            setStatus({
                isOnline: newStatus.isOnline,
                lastSync: newStatus.lastSync,
                pendingChanges: newStatus.pendingChanges,
                conflicts: 0, // TODO: Implement conflict tracking
                errors: []
            });
        } catch (error) {
            console.error('❌ [useSync.updateSyncStatus] Failed to get sync status:', error);
            console.error('❌ [useSync.updateSyncStatus] Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined
            });
        }
    }, []);

    // Update sync stats
    const updateSyncStats = useCallback(async () => {
        console.log('🔍 [useSync.updateSyncStats] Starting sync stats update');
        try {
            console.log('🌐 [useSync.updateSyncStats] Calling getSyncStatus()');
            const newStatus = await getSyncStatus();
            console.log('✅ [useSync.updateSyncStats] Sync stats received:', newStatus);
            setStats({
                totalTasks: newStatus.totalTasks,
                syncedTasks: newStatus.syncedTasks,
                pendingChanges: newStatus.pendingChanges,
                conflicts: 0, // TODO: Implement conflict tracking
                lastSync: newStatus.lastSync
            });
        } catch (error) {
            console.error('❌ [useSync.updateSyncStats] Failed to get sync stats:', error);
            console.error('❌ [useSync.updateSyncStats] Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined
            });
        }
    }, []);

    // Sync tasks
    const sync = useCallback(async () => {
        console.log('🔄 [useSync.sync] Starting sync process');
        try {
            console.log('🔄 [useSync.sync] Calling syncWithGoogleTasks...');
            await syncWithGoogleTasks();
            console.log('✅ [useSync.sync] syncWithGoogleTasks completed');

            console.log('🔄 [useSync.sync] Updating sync status...');
            await updateSyncStatus();
            console.log('✅ [useSync.sync] Sync status updated');

            console.log('🔄 [useSync.sync] Updating sync stats...');
            await updateSyncStats();
            console.log('✅ [useSync.sync] Sync stats updated');
        } catch (error) {
            console.error('❌ [useSync.sync] Sync failed:', error);
            throw error;
        }
    }, [updateSyncStatus, updateSyncStats]);

    // Resolve conflicts - simplified for TRPC
    const resolveConflicts = useCallback(async (resolutions: ConflictResolution[]) => {
        try {
            // TODO: Implement conflict resolution with TRPC
            await updateSyncStatus();
            await updateSyncStats();
        } catch (error) {
            console.error('Failed to resolve conflicts:', error);
            throw error;
        }
    }, [updateSyncStatus, updateSyncStats]);

    // Force sync specific task - simplified for TRPC
    const forceSync = useCallback(async (taskId: string) => {
        try {
            // TODO: Implement force sync with TRPC
            await updateSyncStatus();
            await updateSyncStats();
        } catch (error) {
            console.error('Failed to force sync task:', error);
            throw error;
        }
    }, [updateSyncStatus, updateSyncStats]);

    // Process offline queue - simplified for TRPC
    const processQueue = useCallback(async () => {
        try {
            // TODO: Implement offline queue processing with TRPC
            await updateSyncStatus();
            await updateSyncStats();
        } catch (error) {
            console.error('Failed to process queue:', error);
            throw error;
        }
    }, [updateSyncStatus, updateSyncStats]);

    // Handle sync events - simplified for TRPC
    useEffect(() => {
        // Initial status update
        updateSyncStatus();
        updateSyncStats();
    }, [updateSyncStatus, updateSyncStats]);

    // Handle online/offline changes
    useEffect(() => {
        if (typeof window === 'undefined') return;

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

    // Start auto-sync - simplified for TRPC
    useEffect(() => {
        // TODO: Implement auto-sync with TRPC
        // For now, just update status periodically
        const interval = setInterval(() => {
            updateSyncStatus();
            updateSyncStats();
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [updateSyncStatus, updateSyncStats]);

    return {
        status,
        stats,
        sync,
        resolveConflicts,
        forceSync,
        processQueue
    };
}
