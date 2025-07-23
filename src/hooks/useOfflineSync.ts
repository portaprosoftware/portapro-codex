import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QueuedAction {
  id: string;
  type: 'status_update' | 'notes' | 'photo' | 'signature';
  jobId: string;
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Load queued actions from localStorage
    const saved = localStorage.getItem('portapro_offline_queue');
    if (saved) {
      try {
        setQueuedActions(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load offline queue:', error);
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Syncing queued changes...",
      });
      syncQueuedActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Changes will be synced when connection is restored",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Save queued actions to localStorage whenever they change
    localStorage.setItem('portapro_offline_queue', JSON.stringify(queuedActions));
  }, [queuedActions]);

  const addToQueue = (action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setQueuedActions(prev => [...prev, queuedAction]);

    if (isOnline) {
      syncQueuedActions();
    } else {
      toast({
        title: "Queued for Sync",
        description: "Action will be synced when connection is restored",
      });
    }
  };

  const syncQueuedActions = async () => {
    if (queuedActions.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const successfulActions: string[] = [];

    try {
      for (const action of queuedActions) {
        try {
          // TODO: Implement actual API calls based on action type
          await processAction(action);
          successfulActions.push(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
          // Keep failed actions in queue for retry
        }
      }

      // Remove successfully synced actions
      setQueuedActions(prev => 
        prev.filter(action => !successfulActions.includes(action.id))
      );

      if (successfulActions.length > 0) {
        toast({
          title: "Sync Complete",
          description: `${successfulActions.length} action(s) synced successfully`,
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const processAction = async (action: QueuedAction): Promise<void> => {
    // TODO: Implement actual API calls
    switch (action.type) {
      case 'status_update':
        // await supabase.from('jobs').update({ status: action.data.status }).eq('id', action.jobId);
        break;
      case 'notes':
        // await supabase.from('job_notes').insert({ job_id: action.jobId, notes: action.data.notes });
        break;
      case 'photo':
        // await supabase.storage.from('job-photos').upload(`${action.jobId}/${action.data.filename}`, action.data.file);
        break;
      case 'signature':
        // await supabase.storage.from('signatures').upload(`${action.jobId}/signature.png`, action.data.file);
        break;
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const clearQueue = () => {
    setQueuedActions([]);
    localStorage.removeItem('portapro_offline_queue');
  };

  return {
    isOnline,
    queuedActions,
    isSyncing,
    addToQueue,
    syncQueuedActions,
    clearQueue,
    queueCount: queuedActions.length
  };
}
