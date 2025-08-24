import React from "react";
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import './scanner.css'
import './utils/devUtils.ts' // Load dev utilities

const envClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const PUBLISHABLE_KEY = envClerkKey ?? "pk_live_Y2xlcmsucG9ydGFwcm9zb2Z0d2FyZS5jb20k";
if (!envClerkKey) {
  console.warn("VITE_CLERK_PUBLISHABLE_KEY not set; falling back to production publishable key.");
}

// Development vs Production settings
const isDevelopment = import.meta.env.DEV;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: isDevelopment ? 30 * 1000 : 5 * 60 * 1000, // 30s dev, 5min prod
      gcTime: isDevelopment ? 60 * 1000 : 10 * 60 * 1000, // 1min dev, 10min prod
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
      refetchOnWindowFocus: isDevelopment ? true : false, // Enable in dev for debugging
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
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
