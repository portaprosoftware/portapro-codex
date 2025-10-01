import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface OfflineSpillKitCheck {
  id: string;
  vehicle_id: string;
  template_id: string;
  has_kit: boolean;
  item_conditions: Record<string, any>;
  photos: string[];
  notes: string;
  weather_conditions: string | null;
  weather_details: string | null;
  inspection_duration_minutes: number;
  completion_status: string;
  next_check_due: string;
  checked_at: string;
  checked_by_clerk: string | null;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  syncAttempts: number;
}

export function useSpillKitOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineSpillKitCheck[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load queue from IndexedDB on mount
  useEffect(() => {
    loadOfflineQueue();
    
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Syncing offline spill kit checks...",
      });
      processOfflineQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Checks will be saved locally and synced when back online.",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Open IndexedDB
  const openIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PortaProSpillKits', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('offlineChecks')) {
          const store = db.createObjectStore('offlineChecks', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  };

  // Load offline queue from IndexedDB
  const loadOfflineQueue = async () => {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['offlineChecks'], 'readonly');
      const store = transaction.objectStore('offlineChecks');
      const request = store.getAll();

      request.onsuccess = () => {
        const checks = request.result as OfflineSpillKitCheck[];
        setOfflineQueue(checks.sort((a, b) => b.timestamp - a.timestamp));
      };
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  };

  // Save check to offline queue
  const saveToOfflineQueue = async (checkData: Omit<OfflineSpillKitCheck, 'id' | 'timestamp' | 'status' | 'syncAttempts'>) => {
    try {
      const offlineCheck: OfflineSpillKitCheck = {
        ...checkData,
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        status: 'pending',
        syncAttempts: 0
      };

      const db = await openIndexedDB();
      const transaction = db.transaction(['offlineChecks'], 'readwrite');
      const store = transaction.objectStore('offlineChecks');
      store.add(offlineCheck);

      await loadOfflineQueue();

      toast({
        title: "Check Saved Offline",
        description: "This check will sync when connection is restored.",
      });

      // Try to sync immediately if online
      if (isOnline) {
        processOfflineQueue();
      }

      return offlineCheck.id;
    } catch (error) {
      console.error('Failed to save to offline queue:', error);
      toast({
        title: "Error",
        description: "Failed to save check offline",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Process offline queue
  const processOfflineQueue = async () => {
    if (isSyncing || !isOnline) return;

    const pendingChecks = offlineQueue.filter(check => 
      check.status === 'pending' || check.status === 'error'
    );

    if (pendingChecks.length === 0) return;

    setIsSyncing(true);

    for (const check of pendingChecks) {
      try {
        await updateCheckStatus(check.id, 'syncing');

        // Upload to Supabase
        const { error } = await supabase
          .from("vehicle_spill_kit_checks")
          .insert([{
            vehicle_id: check.vehicle_id,
            template_id: check.template_id,
            has_kit: check.has_kit,
            item_conditions: check.item_conditions,
            photos: check.photos,
            notes: check.notes,
            weather_conditions: check.weather_conditions,
            weather_details: check.weather_details,
            inspection_duration_minutes: check.inspection_duration_minutes,
            completion_status: check.completion_status,
            next_check_due: check.next_check_due,
            checked_at: check.checked_at,
            checked_by_clerk: check.checked_by_clerk
          }]);

        if (error) throw error;

        await updateCheckStatus(check.id, 'synced');
        
        toast({
          title: "Check Synced",
          description: `Spill kit check uploaded successfully`,
        });
      } catch (error) {
        console.error('Failed to sync check:', error);
        await updateCheckStatus(check.id, 'error', check.syncAttempts + 1);
        
        if (check.syncAttempts >= 3) {
          toast({
            title: "Sync Failed",
            description: "Check will be retried later",
            variant: "destructive"
          });
        }
      }
    }

    setIsSyncing(false);
    await loadOfflineQueue();
  };

  // Update check status in IndexedDB
  const updateCheckStatus = async (
    id: string, 
    status: OfflineSpillKitCheck['status'],
    syncAttempts?: number
  ) => {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['offlineChecks'], 'readwrite');
      const store = transaction.objectStore('offlineChecks');
      const request = store.get(id);

      request.onsuccess = () => {
        const check = request.result;
        if (check) {
          check.status = status;
          if (syncAttempts !== undefined) {
            check.syncAttempts = syncAttempts;
          }
          store.put(check);
        }
      };
    } catch (error) {
      console.error('Failed to update check status:', error);
    }
  };

  // Clear synced checks
  const clearSyncedChecks = async () => {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['offlineChecks'], 'readwrite');
      const store = transaction.objectStore('offlineChecks');
      const index = store.index('status');
      const request = index.openCursor(IDBKeyRange.only('synced'));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          loadOfflineQueue();
          toast({
            title: "Queue Cleaned",
            description: "Synced checks removed from offline queue",
          });
        }
      };
    } catch (error) {
      console.error('Failed to clear synced checks:', error);
    }
  };

  const pendingCount = offlineQueue.filter(c => c.status === 'pending' || c.status === 'error').length;
  const syncedCount = offlineQueue.filter(c => c.status === 'synced').length;

  return {
    isOnline,
    offlineQueue,
    isSyncing,
    pendingCount,
    syncedCount,
    saveToOfflineQueue,
    processOfflineQueue,
    clearSyncedChecks
  };
}
