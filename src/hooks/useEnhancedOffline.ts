import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OfflineData {
  id: string;
  type: 'dvir' | 'work_order' | 'job_update' | 'maintenance';
  data: any;
  timestamp: number;
  userId: string;
  syncAttempts: number;
}

export function useEnhancedOffline() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedData, setQueuedData] = useState<OfflineData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Load queued data from localStorage
    const loadQueuedData = () => {
      const saved = localStorage.getItem('portapro_offline_data');
      if (saved) {
        try {
          setQueuedData(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load offline data:', error);
        }
      }
    };

    loadQueuedData();

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Syncing offline data...",
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode Active",
        description: "Your data will be saved locally and synced when connected",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Register background sync tags
        (registration as any).sync?.register('dvir-updates');
        (registration as any).sync?.register('work-order-updates');
        (registration as any).sync?.register('job-updates');
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Save queued data whenever it changes
    localStorage.setItem('portapro_offline_data', JSON.stringify(queuedData));
  }, [queuedData]);

  const addOfflineData = (type: OfflineData['type'], data: any, userId: string) => {
    const offlineItem: OfflineData = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      userId,
      syncAttempts: 0
    };

    setQueuedData(prev => [...prev, offlineItem]);

    if (isOnline) {
      syncOfflineData();
    } else {
      toast({
        title: "Saved Offline",
        description: "Data saved locally and will sync when connection is restored",
      });
    }

    // Trigger background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        const syncTag = `${type}-updates`;
        (registration as any).sync?.register(syncTag);
      });
    }
  };

  const syncOfflineData = async () => {
    if (queuedData.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const successfulSyncs: string[] = [];
    const failedSyncs: OfflineData[] = [];

    try {
      for (const item of queuedData) {
        try {
          await syncDataItem(item);
          successfulSyncs.push(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item, error);
          // Increment sync attempts and keep in queue if under retry limit
          if (item.syncAttempts < 3) {
            failedSyncs.push({ ...item, syncAttempts: item.syncAttempts + 1 });
          }
        }
      }

      // Remove successfully synced items and update failed items
      setQueuedData(failedSyncs);

      if (successfulSyncs.length > 0) {
        toast({
          title: "Sync Complete",
          description: `${successfulSyncs.length} item(s) synced successfully`,
        });
      }

      if (failedSyncs.length > 0) {
        toast({
          title: "Partial Sync",
          description: `${failedSyncs.length} item(s) failed to sync and will retry`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync operation failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncDataItem = async (item: OfflineData): Promise<void> => {
    switch (item.type) {
      case 'dvir':
        await supabase
          .from('dvir_reports')
          .insert(item.data);
        break;
        
      case 'work_order':
        await supabase
          .from('work_orders')
          .insert(item.data);
        break;
        
      case 'job_update':
        await supabase
          .from('jobs')
          .update(item.data.updates)
          .eq('id', item.data.jobId);
        break;
        
      case 'maintenance':
        await supabase
          .from('maintenance_updates')
          .insert(item.data);
        break;
    }
  };

  const clearOfflineQueue = () => {
    setQueuedData([]);
    localStorage.removeItem('portapro_offline_data');
    toast({
      title: "Queue Cleared",
      description: "All offline data has been cleared",
    });
  };

  // Cache critical data for offline use
  const cacheForOffline = async (dataType: string, data: any) => {
    const cacheKey = `portapro_cache_${dataType}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));
  };

  const getCachedData = (dataType: string) => {
    const cacheKey = `portapro_cache_${dataType}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        if (parsedCache.expiresAt > Date.now()) {
          return parsedCache.data;
        } else {
          localStorage.removeItem(cacheKey);
        }
      } catch (error) {
        console.error('Failed to parse cached data:', error);
        localStorage.removeItem(cacheKey);
      }
    }
    
    return null;
  };

  return {
    isOnline,
    queuedData,
    isSyncing,
    queueCount: queuedData.length,
    addOfflineData,
    syncOfflineData,
    clearOfflineQueue,
    cacheForOffline,
    getCachedData
  };
}
