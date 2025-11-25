import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

interface ClerkGateProps {
  children: React.ReactNode;
}

/**
 * ClerkGate ensures we never render routes until Clerk has finished loading.
 * This prevents SignedOut flashes and keeps refreshes stable on tenant subdomains.
 */
export const ClerkGate: React.FC<ClerkGateProps> = ({ children }) => {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="text-base font-medium text-foreground">Preparing your workspace</p>
            <p className="text-sm text-muted-foreground">Almost there…</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
