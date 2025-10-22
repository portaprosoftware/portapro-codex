import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { OrgGate } from "@/components/auth/OrgGate";

export function RequireTenantAuth({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <OrgGate>{children}</OrgGate>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/dashboard" />
      </SignedOut>
    </>
  );
}
