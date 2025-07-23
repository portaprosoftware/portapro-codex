import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QueuedAction {
  id: string;
  type: 'job_creation' | 'status_update' | 'notes' | 'photo' | 'signature';
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
    switch (action.type) {
      case 'job_creation':
        // Generate job number
        const jobTypePrefix = {
          'delivery': 'DEL',
          'pickup': 'PKP',
          'service': 'SVC'
        }[action.data.job_type];
        const jobNumber = `${jobTypePrefix}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        
        await supabase
          .from('jobs')
          .insert({
            ...action.data,
            job_number: jobNumber,
            status: 'assigned',
            timezone: action.data.timezone || 'America/New_York'
          });
        break;
        
      case 'status_update':
        await supabase
          .from('jobs')
          .update({ 
            status: action.data.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', action.jobId);
        break;
        
      case 'notes':
        await (supabase as any)
          .rpc('add_job_note', {
            job_uuid: action.jobId,
            driver_uuid: action.data.driverId,
            note_content: action.data.noteText,
            note_category: action.data.noteType || 'general'
          });
        break;
        
      case 'photo':
        const timestamp = Date.now();
        const filename = `${action.jobId}/${action.data.driverId}/${action.data.category || 'general'}_${timestamp}.jpg`;
        
        await supabase.storage
          .from('job-photos')
          .upload(filename, action.data.file, {
            contentType: 'image/jpeg',
            upsert: false
          });
        break;
        
      case 'signature':
        const sigTimestamp = Date.now();
        const sigFilename = `${action.jobId}/${action.data.driverId}/signature_${sigTimestamp}.png`;
        
        await supabase.storage
          .from('job-signatures')
          .upload(sigFilename, action.data.signatureBlob, {
            contentType: 'image/png',
            upsert: false
          });
        break;
    }
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
