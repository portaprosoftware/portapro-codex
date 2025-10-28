console.log('VITE_ALLOWED_CLERK_ORG_SLUGS:', import.meta.env.VITE_ALLOWED_CLERK_ORG_SLUGS);
window.VITE_ALLOWED_CLERK_ORG_SLUGS = import.meta.env.VITE_ALLOWED_CLERK_ORG_SLUGS;
import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import "./scanner.css";
import "./utils/devUtils.ts"; // Load dev utilities
import { clearClerkCache } from "./utils/authCleanup";
import { clearAllCaches } from "./utils/devUtils";
import { Toaster } from "@/components/ui/sonner";
import { env } from "./env.client";

// -----------------------------------------------------------------------------
// Environment (Vite): read ONLY from env; no host-based dev/prod switching
// -----------------------------------------------------------------------------
const CLERK_PUBLISHABLE_KEY = env.CLERK_PUBLISHABLE_KEY;

// Gentle guard to avoid accidentally shipping a test key
if (CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")) {
  // eslint-disable-next-line no-console
  console.warn(
    "⚠️ Using a Clerk TEST key (pk_test_…). Set VITE_CLERK_PUBLISHABLE_KEY=pk_live_… for production tenants."
  );
}

// -----------------------------------------------------------------------------
// React Query client
// -----------------------------------------------------------------------------
const isDevelopment = env.isDev;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (
          error?.name === "DataCloneError" ||
          error?.message?.includes("DataCloneError") ||
          error?.message?.includes("Request object could not be cloned") ||
          error?.message?.includes("postMessage")
        ) {
          console.error("Non-serializable error detected - not retrying:", error?.name);
          return false;
        }
        if (error?.code === "400" || error?.status === 400) {
          console.error("Bad request error - not retrying:", error);
          return false;
        }
        return failureCount < (isDevelopment ? 1 : 3);
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (
          error?.name === "DataCloneError" ||
          error?.message?.includes("DataCloneError") ||
          error?.message?.includes("Request object could not be cloned") ||
          error?.message?.includes("postMessage")
        ) {
          console.error("Non-serializable error in mutation - not retrying:", error?.name);
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Expose for any global handlers/debug
(window as any).queryClient = queryClient;

// -----------------------------------------------------------------------------
// Mount
// -----------------------------------------------------------------------------
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        // When using hosted accounts, these ensure we always land in the app
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      >
        <App />
        <Toaster />
      </ClerkProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
