import { useEffect, useMemo } from "react";
import { useAuth, useUser, useOrganization, useClerk, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useLocation, Navigate } from "react-router-dom";
import { getTenantSlugFromHost } from "@/utils/tenant";

type Props = { children: React.ReactNode; noAccessPath?: string };

export function OrgGate({ children, noAccessPath = "/no-access" }: Props) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { organization, setActive } = useOrganization();
  const { hostname } = window.location;
  const location = useLocation();

  const tenantSlug = useMemo(() => getTenantSlugFromHost(hostname), [hostname]);

  // On customer subdomains, enforce org membership / active org.
  useEffect(() => {
    if (!isSignedIn || !tenantSlug || !user) return;

    const memberships = user.organizationMemberships || [];
    const match = memberships.find(m => m.organization.slug === tenantSlug);

    // Not a member of this tenant → send to no access (or sign out).
    if (!match) return;

    // Member but wrong active org → switch silently.
    if (!organization || organization.slug !== tenantSlug) {
      setActive({ organization: match.organization.id }).catch(() => {
        // If switching fails for any reason, we’ll fall back to no-access route below.
      });
    }
  }, [isSignedIn, tenantSlug, user, organization, setActive]);

  // If there is a tenant slug, block unsigned users with Clerk’s redirect.
  if (tenantSlug) {
    return (
      <>
        <SignedIn>
          {user?.organizationMemberships?.some(m => m.organization.slug === tenantSlug) ? (
            // allowed
            <>{children}</>
          ) : (
            // signed-in but not a member of this org
            <Navigate to={noAccessPath} replace state={{ from: location }} />
          )}
        </SignedIn>
        <SignedOut>
          {/* Clerk will handle sign-in and send back to the same URL; your root redirect logic will push them to /dashboard */}
          <Navigate to="/auth" replace state={{ from: location }} />
        </SignedOut>
      </>
    );
  }

  // On root domain (no tenant slug), do not gate.
  return <>{children}</>;
}
