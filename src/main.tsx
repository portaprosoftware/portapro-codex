window.onerror = (message, source, lineno, colno, error) => {
  console.error("BOOT_CRASH window.onerror", { message, source, lineno, colno, error });
};

window.addEventListener("unhandledrejection", (event) => {
  console.error("BOOT_CRASH unhandledrejection", event.reason ?? event);
});

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
import { OrganizationProvider } from "./contexts/OrganizationContext";
import { ClerkGate } from "./components/auth/ClerkGate";

// -----------------------------------------------------------------------------
// Environment (Vite): read ONLY from env; no host-based dev/prod switching
// -----------------------------------------------------------------------------
const CLERK_PUBLISHABLE_KEY = env.VITE_CLERK_PUBLISHABLE_KEY;

// Gentle guard to avoid accidentally shipping a test key
if (String(CLERK_PUBLISHABLE_KEY ?? "").startsWith("pk_test_")) {
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
// Service Worker Registration (for push notifications and offline support)
// -----------------------------------------------------------------------------
const serviceWorkerEnabled =
  env.isProd && env.VITE_ENABLE_SERVICE_WORKER?.toLowerCase() === "true";

if ('serviceWorker' in navigator && serviceWorkerEnabled) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator && !serviceWorkerEnabled) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

// -----------------------------------------------------------------------------
// Mount
// -----------------------------------------------------------------------------
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        // No fallback redirects - Marketing site handles subdomain routing after sign-in
      >
        <ClerkGate>
          <OrganizationProvider>
            <App />
            <Toaster />
          </OrganizationProvider>
        </ClerkGate>
      </ClerkProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
