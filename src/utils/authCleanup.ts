/**
 * Utility functions to clean up authentication cache in development
 */

export const clearClerkCache = () => {
  console.log('Clearing authentication cache (Clerk + Supabase)...');
  
  // Clear localStorage keys related to Clerk
  const clerkKeys = Object.keys(localStorage).filter(key => 
    key.includes('clerk') || 
    key.includes('__clerk') ||
    key.startsWith('$$clerk')
  );
  
  clerkKeys.forEach(key => {
    console.log('Removing localStorage key:', key);
    localStorage.removeItem(key);
  });
  
  // Clear sessionStorage keys related to Clerk
  const clerkSessionKeys = Object.keys(sessionStorage).filter(key => 
    key.includes('clerk') || 
    key.includes('__clerk') ||
    key.startsWith('$$clerk')
  );
  
  clerkSessionKeys.forEach(key => {
    console.log('Removing sessionStorage key:', key);
    sessionStorage.removeItem(key);
  });

  // Clear Supabase auth keys (avoid limbo states when switching environments)
  const supabaseLocalKeys = Object.keys(localStorage).filter(key =>
    key.startsWith('supabase.auth.') || key.includes('sb-')
  );
  supabaseLocalKeys.forEach(key => {
    console.log('Removing Supabase localStorage key:', key);
    localStorage.removeItem(key);
  });

  const supabaseSessionKeys = Object.keys(sessionStorage).filter(key =>
    key.startsWith('supabase.auth.') || key.includes('sb-')
  );
  supabaseSessionKeys.forEach(key => {
    console.log('Removing Supabase sessionStorage key:', key);
    sessionStorage.removeItem(key);
  });
  
  console.log('Auth cache cleared. Please refresh the page.');
};

export const logCurrentAuthState = () => {
  console.log('=== Current Auth State ===');
  
  // Log all localStorage keys that might be auth-related
  const authKeys = Object.keys(localStorage).filter(key => 
    key.includes('clerk') || 
    key.includes('auth') ||
    key.includes('user') ||
    key.includes('session')
  );
  
  console.log('Auth-related localStorage keys:', authKeys);
  
  authKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value?.substring(0, 100) + (value && value.length > 100 ? '...' : ''));
    } catch (e) {
      console.log(`${key}: [Error reading value]`);
    }
  });
  
  console.log('=== End Auth State ===');
};

// Make functions available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).clearClerkCache = clearClerkCache;
  (window as any).logCurrentAuthState = logCurrentAuthState;
  console.log('Development auth utilities loaded. Use clearClerkCache() or logCurrentAuthState() in console.');
}