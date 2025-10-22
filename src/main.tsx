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

// Clerk configuration: Host-based key selection
const PROD_HOSTS = new Set(['portaprosoftware.com', 'www.portaprosoftware.com']);
const hostname = window.location.hostname;
const useProdKey = PROD_HOSTS.has(hostname);

// ✅ Always pull Clerk key from environment (set in Vercel)
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("❌ Missing Clerk publishable key. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your environment.");
}


// Log Clerk mode without exposing keys
console.info(`Clerk mode: ${useProdKey ? 'PRODUCTION' : 'DEVELOPMENT'} (${hostname})`);

if (!CLERK_PUBLISHABLE_KEY) {
  console.error('Missing Clerk publishable key.');
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
