import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wifi, WifiOff, Upload, Camera, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OfflineOCRData {
  id: string;
  itemId: string;
  itemCode: string;
  imageBase64: string;
  timestamp: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  ocrResults?: any;
}

export const OfflineOCRCapture: React.FC = () => {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineOCRData[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Load offline queue from IndexedDB
    loadOfflineQueue();

    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineQueue = async () => {
    try {
      // Open IndexedDB
      const db = await openIndexedDB();
      const transaction = db.transaction(['ocrQueue'], 'readonly');
      const store = transaction.objectStore('ocrQueue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        setOfflineQueue(request.result || []);
      };
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  };

  const openIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PortaProOCR', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('ocrQueue')) {
          const store = db.createObjectStore('ocrQueue', { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  };

  const saveToOfflineQueue = async (ocrData: Omit<OfflineOCRData, 'id'>) => {
    const dataWithId = {
      ...ocrData,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['ocrQueue'], 'readwrite');
      const store = transaction.objectStore('ocrQueue');
      await store.add(dataWithId);
      
      setOfflineQueue(prev => [...prev, dataWithId]);
      
      toast({
        title: "Saved Offline",
        description: "OCR data saved locally. Will sync when online.",
      });
    } catch (error) {
      console.error('Error saving to offline queue:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save OCR data offline.",
        variant: "destructive",
      });
    }
  };

  const processOfflineQueue = async () => {
    if (!isOnline || isUploading) return;

    const pendingItems = offlineQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      
      try {
        // Update status to uploading
        await updateItemStatus(item.id, 'uploading');
        
        // Process OCR (simulate API call)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update status to completed
        await updateItemStatus(item.id, 'completed');
        
        setUploadProgress(((i + 1) / pendingItems.length) * 100);
        
      } catch (error) {
        console.error('Upload failed for item:', item.id, error);
        await updateItemStatus(item.id, 'failed');
      }
    }

    setIsUploading(false);
    toast({
      title: "Sync Complete",
      description: `Processed ${pendingItems.length} offline OCR captures`,
    });
  };

  const updateItemStatus = async (id: string, status: OfflineOCRData['status']) => {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['ocrQueue'], 'readwrite');
      const store = transaction.objectStore('ocrQueue');
      
      const item = offlineQueue.find(i => i.id === id);
      if (item) {
        const updatedItem = { ...item, status };
        await store.put(updatedItem);
        
        setOfflineQueue(prev => 
          prev.map(i => i.id === id ? updatedItem : i)
        );
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const clearCompletedItems = async () => {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['ocrQueue'], 'readwrite');
      const store = transaction.objectStore('ocrQueue');
      
      const completedItems = offlineQueue.filter(item => item.status === 'completed');
      for (const item of completedItems) {
        await store.delete(item.id);
      }
      
      setOfflineQueue(prev => prev.filter(item => item.status !== 'completed'));
    } catch (error) {
      console.error('Error clearing completed items:', error);
    }
  };

  const getStatusBadge = (status: OfflineOCRData['status']) => {
    const badges = {
      pending: <Badge variant="outline" className="text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
      uploading: <Badge className="bg-blue-100 text-blue-700"><Upload className="w-3 h-3 mr-1" />Uploading</Badge>,
      completed: <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>,
      failed: <Badge className="bg-red-100 text-red-700">Failed</Badge>
    };
    return badges[status];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Offline OCR Queue
          </span>
          <Badge variant={isOnline ? "default" : "destructive"} className="gap-1">
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {offlineQueue.filter(item => item.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {offlineQueue.filter(item => item.status === 'uploading').length}
            </div>
            <div className="text-sm text-gray-600">Uploading</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {offlineQueue.filter(item => item.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Syncing offline captures...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={processOfflineQueue}
            disabled={!isOnline || isUploading || offlineQueue.filter(item => item.status === 'pending').length === 0}
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Sync Now
          </Button>
          <Button
            variant="outline"
            onClick={clearCompletedItems}
            disabled={offlineQueue.filter(item => item.status === 'completed').length === 0}
            size="sm"
          >
            Clear Completed
          </Button>
        </div>

        {/* Queue Items */}
        {offlineQueue.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {offlineQueue.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-white border rounded">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.itemCode}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
                <div>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
            {offlineQueue.length > 10 && (
              <div className="text-center text-sm text-gray-600">
                ...and {offlineQueue.length - 10} more items
              </div>
            )}
          </div>
        )}

        {offlineQueue.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No offline OCR captures
          </div>
        )}
      </CardContent>
    </Card>
  );
};