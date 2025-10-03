import React from "react";
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import './scanner.css'
import './utils/devUtils.ts' // Load dev utilities
import { clearClerkCache } from './utils/authCleanup'

const envClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const defaultDevKey = "pk_test_YWN0dWFsLW11dHQtOTEuY2xlcmsuYWNjb3VudHMuZGV2JA";
const isDevHost = location.hostname.includes('localhost') || location.hostname.includes('lovable.dev');
const isLiveKey = envClerkKey?.startsWith('pk_live_') ?? false;

let effectiveClerkKey = envClerkKey ?? defaultDevKey;
if (isLiveKey && isDevHost) {
  console.warn("Detected production Clerk key on a dev host. Falling back to dev key and clearing auth cache.");
  try { clearClerkCache(); } catch {}
  effectiveClerkKey = defaultDevKey;
}

if (!envClerkKey) {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY not set; using provided development publishable key.");
}

// Development vs Production settings
const isDevelopment = import.meta.env.DEV;

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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={effectiveClerkKey}>
        <App />
      </ClerkProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
