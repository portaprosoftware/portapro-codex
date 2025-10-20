import React from "react";
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import './scanner.css'
import './utils/devUtils.ts' // Load dev utilities
import { clearClerkCache } from './utils/authCleanup'
import { clearAllCaches } from './utils/devUtils'
import { Toaster } from '@/components/ui/sonner';

// Development vs Production settings
const isDevelopment = import.meta.env.DEV;

// Clerk configuration: explicit domain to avoid redirect issues
const CLERK_PUBLISHABLE_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined) || (isDevelopment ? "pk_test_YWN0dWFsLW11dHQtOTEuY2xlcmsuYWNjb3VudHMuZGV2JA" : "");

if (!CLERK_PUBLISHABLE_KEY && !isDevelopment) {
  console.error('Missing VITE_CLERK_PUBLISHABLE_KEY in production.');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes for all environments
      gcTime: 10 * 60 * 1000, // 10 minutes cache
      retry: (failureCount, error) => {
        // Don't retry DataCloneError or network request errors
        if (error?.name === 'DataCloneError' || 
            error?.message?.includes('DataCloneError') ||
            error?.message?.includes('Request object could not be cloned') ||
            error?.message?.includes('postMessage')) {
          console.error('Non-serializable error detected - not retrying:', error?.name);
          return false;
        }
        // Don't retry 400 errors (bad request) 
        if ((error as any)?.code === '400' || (error as any)?.status === 400) {
          console.error('Bad request error - not retrying:', error);
          return false;
        }
        return failureCount < (isDevelopment ? 1 : 3); // Less retry in dev
      },
      refetchOnWindowFocus: false, // Disable to prevent excessive refetching
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry DataCloneError or network request errors
        if (error?.name === 'DataCloneError' || 
            error?.message?.includes('DataCloneError') ||
            error?.message?.includes('Request object could not be cloned') ||
            error?.message?.includes('postMessage')) {
          console.error('Non-serializable error in mutation - not retrying:', error?.name);
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Make queryClient globally available for error boundary
(window as any).queryClient = queryClient;

// One-time cache clear for PWA icon update
const BUILD_ID = '2025-10-20-pwa-update';
const storedBuildId = localStorage.getItem('__build_id');
if (storedBuildId !== BUILD_ID) {
  console.log('Build ID changed - clearing caches for fresh PWA icons');
  clearAllCaches().then(() => {
    localStorage.setItem('__build_id', BUILD_ID);
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider 
        publishableKey={CLERK_PUBLISHABLE_KEY}
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      >
        <App />
        <Toaster />
      </ClerkProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
