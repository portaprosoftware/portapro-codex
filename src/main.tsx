import React from "react";
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import './scanner.css'

const PUBLISHABLE_KEY = "pk_test_YWN0dWFsLW11dHQtOTEuY2xlcmsuYWNjb3VudHMuZGV2JA";

// Clear any cached Clerk auth state to reset everything
if (typeof window !== 'undefined') {
  // Clear Clerk cache
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('clerk-') || key.includes('clerk')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('clerk-') || key.includes('clerk')) {
      sessionStorage.removeItem(key);
    }
  });
}

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
