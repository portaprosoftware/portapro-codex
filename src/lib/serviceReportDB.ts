// IndexedDB helper for storing service reports offline
export interface OfflineServiceReport {
  id: string;
  jobId: string;
  templateId: string;
  formData: Record<string, any>;
  status: 'draft' | 'pending' | 'synced' | 'error';
  timestamp: string;
  syncAttempts?: number;
  lastSyncError?: string;
  photos: Array<{ fieldId: string; dataUrl: string }>;
  signatures: Array<{ fieldId: string; dataUrl: string }>;
}

const DB_NAME = 'service-reports-db';
const DB_VERSION = 1;

const STORES = {
  DRAFT_REPORTS: 'draft-reports',
  PENDING_REPORTS: 'pending-reports',
  MEDIA_FILES: 'media-files',
};

let dbInstance: IDBDatabase | null = null;

export const openServiceReportDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.DRAFT_REPORTS)) {
        db.createObjectStore(STORES.DRAFT_REPORTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PENDING_REPORTS)) {
        db.createObjectStore(STORES.PENDING_REPORTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.MEDIA_FILES)) {
        db.createObjectStore(STORES.MEDIA_FILES, { keyPath: 'id' });
      }
    };
  });
};

export const saveDraftReport = async (report: OfflineServiceReport): Promise<void> => {
  const db = await openServiceReportDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.DRAFT_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.DRAFT_REPORTS);
    const request = store.put({ ...report, status: 'draft' });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const savePendingReport = async (report: OfflineServiceReport): Promise<void> => {
  const db = await openServiceReportDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const request = store.put({ ...report, status: 'pending' });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getDraftReport = async (jobId: string): Promise<OfflineServiceReport | null> => {
  const db = await openServiceReportDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.DRAFT_REPORTS], 'readonly');
    const store = transaction.objectStore(STORES.DRAFT_REPORTS);
    const request = store.get(jobId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getAllPendingReports = async (): Promise<OfflineServiceReport[]> => {
  const db = await openServiceReportDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const deleteDraftReport = async (id: string): Promise<void> => {
  const db = await openServiceReportDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.DRAFT_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.DRAFT_REPORTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deletePendingReport = async (id: string): Promise<void> => {
  const db = await openServiceReportDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const updateReportStatus = async (
  id: string,
  status: OfflineServiceReport['status'],
  error?: string
): Promise<void> => {
  const db = await openServiceReportDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const report = getRequest.result;
      if (report) {
        report.status = status;
        if (error) {
          report.lastSyncError = error;
          report.syncAttempts = (report.syncAttempts || 0) + 1;
        }
        store.put(report);
        resolve();
      } else {
        reject(new Error('Report not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const clearSyncedReports = async (): Promise<void> => {
  const db = await openServiceReportDB();
  const reports = await getAllPendingReports();
  const syncedReports = reports.filter((r) => r.status === 'synced');

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_REPORTS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_REPORTS);

    let completed = 0;
    syncedReports.forEach((report) => {
      const request = store.delete(report.id);
      request.onsuccess = () => {
        completed++;
        if (completed === syncedReports.length) resolve();
      };
      request.onerror = () => reject(request.error);
    });

    if (syncedReports.length === 0) resolve();
  });
};
