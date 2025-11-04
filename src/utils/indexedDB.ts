import { openDB, IDBPDatabase } from 'idb';

let dbInstance: IDBPDatabase | null = null;

/**
 * Initialize IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB('portapro-technician', 1, {
    upgrade(db) {
      // Work Orders store
      if (!db.objectStoreNames.contains('workOrders')) {
        const workOrderStore = db.createObjectStore('workOrders', { keyPath: 'id' });
        workOrderStore.createIndex('lastUpdated', 'lastUpdated');
      }

      // Photos store
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('workOrderId', 'workOrderId');
        photoStore.createIndex('synced', 'synced');
        photoStore.createIndex('timestamp', 'timestamp');
      }

      // Queued Operations store
      if (!db.objectStoreNames.contains('queuedOperations')) {
        const queueStore = db.createObjectStore('queuedOperations', { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp');
        queueStore.createIndex('type', 'type');
      }

      // Sync Metadata store
      if (!db.objectStoreNames.contains('syncMetadata')) {
        db.createObjectStore('syncMetadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

/**
 * Cache work order data
 */
export async function cacheWorkOrder(id: string, data: any): Promise<void> {
  const db = await initDB();
  await db.put('workOrders', {
    id,
    data,
    lastUpdated: Date.now(),
  });
}

/**
 * Get cached work order
 */
export async function getCachedWorkOrder(id: string): Promise<any | null> {
  const db = await initDB();
  const cached = await db.get('workOrders', id);
  return cached?.data || null;
}

/**
 * Get all cached work orders
 */
export async function getAllCachedWorkOrders(): Promise<any[]> {
  const db = await initDB();
  const cached = await db.getAll('workOrders');
  return cached.map((item: any) => item.data);
}

/**
 * Cache photo for offline use
 */
export async function cachePhoto(
  id: string,
  workOrderId: string,
  dataUrl: string,
  type: 'before' | 'after' | 'progress' | 'issue',
  options?: { caption?: string; uploadedBy?: string }
): Promise<void> {
  const db = await initDB();
  await db.put('photos', {
    id,
    workOrderId,
    dataUrl,
    type,
    caption: options?.caption,
    uploadedBy: options?.uploadedBy,
    timestamp: Date.now(),
    synced: false,
  });
}

/**
 * Get cached photos for a work order
 */
export async function getCachedPhotos(workOrderId: string): Promise<any[]> {
  const db = await initDB();
  const tx = db.transaction('photos', 'readonly');
  const index = tx.store.index('workOrderId');
  const photos = await index.getAll(IDBKeyRange.only(workOrderId));
  return photos;
}

/**
 * Get all unsynced photos
 */
export async function getUnsyncedPhotos(): Promise<any[]> {
  const db = await initDB();
  const tx = db.transaction('photos', 'readonly');
  const index = tx.store.index('synced');
  const photos = await index.getAll(IDBKeyRange.only(false));
  return photos;
}

/**
 * Mark photo as synced
 */
export async function markPhotoSynced(photoId: string): Promise<void> {
  const db = await initDB();
  const photo = await db.get('photos', photoId);
  if (photo) {
    photo.synced = true;
    await db.put('photos', photo);
  }
}

/**
 * Queue an operation for later execution
 */
export async function queueOperation(
  type: 'photo_upload' | 'status_update' | 'work_order_complete',
  payload: any
): Promise<string> {
  const db = await initDB();
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.put('queuedOperations', {
    id,
    type,
    payload,
    timestamp: Date.now(),
    retries: 0,
  });

  return id;
}

/**
 * Get all queued operations
 */
export async function getQueuedOperations(): Promise<any[]> {
  const db = await initDB();
  return await db.getAll('queuedOperations');
}

/**
 * Remove operation from queue
 */
export async function removeQueuedOperation(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('queuedOperations', id);
}

/**
 * Increment operation retry count
 */
export async function incrementRetryCount(id: string): Promise<void> {
  const db = await initDB();
  const operation = await db.get('queuedOperations', id);
  if (operation) {
    operation.retries++;
    await db.put('queuedOperations', operation);
  }
}

/**
 * Get sync metadata
 */
export async function getSyncMetadata(key: string): Promise<any | null> {
  const db = await initDB();
  return await db.get('syncMetadata', key);
}

/**
 * Update sync metadata
 */
export async function updateSyncMetadata(
  key: string,
  lastSync: number,
  status: 'idle' | 'syncing' | 'error'
): Promise<void> {
  const db = await initDB();
  await db.put('syncMetadata', { key, lastSync, status });
}

/**
 * Clear all cached data (for logout or reset)
 */
export async function clearAllCache(): Promise<void> {
  const db = await initDB();
  await db.clear('workOrders');
  await db.clear('photos');
  await db.clear('queuedOperations');
  await db.clear('syncMetadata');
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  workOrders: number;
  photos: number;
  queuedOperations: number;
  unsyncedPhotos: number;
}> {
  const db = await initDB();
  
  const workOrders = await db.count('workOrders');
  const photos = await db.count('photos');
  const queuedOperations = await db.count('queuedOperations');
  
  const tx = db.transaction('photos', 'readonly');
  const index = tx.store.index('synced');
  const unsyncedPhotos = await index.count(IDBKeyRange.only(false));

  return {
    workOrders,
    photos,
    queuedOperations,
    unsyncedPhotos,
  };
}
