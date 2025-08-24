/**
 * Development utilities for debugging and cache management
 */

export const clearAllCaches = async () => {
  console.log('🧹 Clearing all caches...');
  
  // Clear React Query cache
  const queryClient = (window as any).queryClient;
  if (queryClient) {
    queryClient.clear();
    console.log('✅ React Query cache cleared');
  }

  // Clear Service Worker caches (if available)
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log('🗑️ Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
    console.log('✅ Service Worker caches cleared');
  }

  // Clear localStorage (PortaPro related only)
  const keysToKeep = ['clerk-db-jwt', '__clerk_db_jwt'];
  Object.keys(localStorage).forEach(key => {
    if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
      localStorage.removeItem(key);
    }
  });
  console.log('✅ localStorage cleared (keeping auth)');

  // Force page reload to ensure fresh state
  setTimeout(() => {
    console.log('🔄 Reloading page for fresh state...');
    window.location.reload();
  }, 1000);
};

export const logQueryStatus = (queryKey: string, data: any, error: any, isLoading: boolean) => {
  if (import.meta.env.DEV) {
    console.log(`📊 Query [${queryKey}]:`, {
      isLoading,
      hasData: !!data,
      dataCount: Array.isArray(data) ? data.length : 'N/A',
      error: error?.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export const addManualRefreshButton = () => {
  if (import.meta.env.DEV && !document.getElementById('dev-refresh-btn')) {
    const button = document.createElement('button');
    button.id = 'dev-refresh-btn';
    button.innerHTML = '🔄 Clear Cache';
    button.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      background: #dc2626;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    `;
    button.onclick = clearAllCaches;
    document.body.appendChild(button);
  }
};

// Auto-add refresh button in development - DISABLED
// if (import.meta.env.DEV) {
//   document.addEventListener('DOMContentLoaded', addManualRefreshButton);
//   // Also try to add it immediately if DOM is already loaded
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', addManualRefreshButton);
//   } else {
//     addManualRefreshButton();
//   }
// }