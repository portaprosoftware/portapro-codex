import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getQueuedOperations,
  removeQueuedOperation,
  incrementRetryCount,
  getUnsyncedPhotos,
  markPhotoSynced,
  updateSyncMetadata,
  getCacheStats,
} from '@/utils/indexedDB';
import { uploadWorkOrderPhoto } from '@/utils/photoUpload';
import { useOnlineStatus } from './useOnlineStatus';

const MAX_RETRIES = 3;

export function useOfflineSync() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({
    workOrders: 0,
    photos: 0,
    queuedOperations: 0,
    unsyncedPhotos: 0,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update stats periodically
  const updateStats = useCallback(async () => {
    const newStats = await getCacheStats();
    setStats(newStats);
  }, []);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  const syncPhotos = useCallback(async () => {
    const unsyncedPhotos = await getUnsyncedPhotos();
    if (unsyncedPhotos.length === 0) return 0;

    let synced = 0;
    for (const photo of unsyncedPhotos) {
      try {
        const result = await uploadWorkOrderPhoto(photo.dataUrl, {
          workOrderId: photo.workOrderId,
          photoType: photo.type,
          caption: photo.caption,
          uploadedBy: photo.uploadedBy,
        });

        if (result.success) {
          await markPhotoSynced(photo.id);
          synced++;
        }
      } catch (error) {
        console.error('Failed to sync photo:', error);
      }
    }

    return synced;
  }, []);

  const syncQueuedOperations = useCallback(async () => {
    const operations = await getQueuedOperations();
    if (operations.length === 0) return 0;

    let processed = 0;

    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'status_update': {
            const { workOrderId, status } = operation.payload;
            const { error } = await supabase
              .from('work_orders')
              .update({ 
                status,
                updated_at: new Date().toISOString()
              })
              .eq('id', workOrderId);

            if (error) throw error;
            break;
          }

          case 'work_order_complete': {
            const { workOrderId, updates } = operation.payload;
            const { error } = await supabase
              .from('work_orders')
              .update(updates)
              .eq('id', workOrderId);

            if (error) throw error;
            break;
          }

          case 'photo_upload': {
            const { dataUrl, options } = operation.payload;
            const result = await uploadWorkOrderPhoto(dataUrl, options);
            if (!result.success) throw new Error(result.error);
            break;
          }
        }

        await removeQueuedOperation(operation.id);
        processed++;
      } catch (error) {
        console.error('Failed to process operation:', error);
        
        if (operation.retries < MAX_RETRIES) {
          await incrementRetryCount(operation.id);
        } else {
          // Max retries reached, remove operation
          await removeQueuedOperation(operation.id);
          console.error('Operation failed after max retries:', operation);
        }
      }
    }

    return processed;
  }, []);

  const performSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      // Get total items to sync
      const unsyncedPhotos = await getUnsyncedPhotos();
      const queuedOps = await getQueuedOperations();
      const totalItems = unsyncedPhotos.length + queuedOps.length;

      if (totalItems === 0) {
        setIsSyncing(false);
        return;
      }

      setSyncProgress({ current: 0, total: totalItems });

      // Sync photos
      const photosSynced = await syncPhotos();
      setSyncProgress(prev => ({ ...prev, current: prev.current + photosSynced }));

      // Sync queued operations
      const operationsProcessed = await syncQueuedOperations();
      setSyncProgress(prev => ({ ...prev, current: prev.current + operationsProcessed }));

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['technician-work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-order-photos'] });

      // Update sync metadata
      await updateSyncMetadata('last-sync', Date.now(), 'idle');

      // Update stats
      await updateStats();

      const totalSynced = photosSynced + operationsProcessed;
      if (totalSynced > 0) {
        toast({
          title: 'Sync complete',
          description: `Successfully synced ${totalSynced} item${totalSynced === 1 ? '' : 's'}`,
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      await updateSyncMetadata('last-sync', Date.now(), 'error');
      
      toast({
        title: 'Sync failed',
        description: 'Some items could not be synced. Will retry later.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress({ current: 0, total: 0 });
    }
  }, [isOnline, isSyncing, syncPhotos, syncQueuedOperations, queryClient, toast, updateStats]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      performSync();
    }
  }, [wasOffline, isOnline, performSync]);

  // Periodic sync when online (every 2 minutes)
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      performSync();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isOnline, performSync]);

  return {
    isOnline,
    isSyncing,
    syncProgress,
    stats,
    performSync,
  };
}
