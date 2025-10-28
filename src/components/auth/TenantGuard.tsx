import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useOrganizationList, useOrganization } from '@clerk/clerk-react';
import { env } from '@/env.client';
import { Loader2 } from 'lucide-react';

interface TenantGuardProps {
  children: React.ReactNode;
}

/**
 * TenantGuard: Multi-tenant login enforcement
 * 
 * Ensures users can only access deployments where they belong to the allowed Clerk Organization(s).
 * 
 * Logic:
 * - Reads VITE_ALLOWED_CLERK_ORG_SLUGS (comma-separated) from env
 * - If user is authenticated:
 *   - Checks if user belongs to any allowed organization
 *   - If yes: sets that org as active and renders children
 *   - If no: signs user out and redirects to /unauthorized
 * - In development with no ALLOWED_CLERK_ORG_SLUGS: allows access for convenience
 * - In production with no ALLOWED_CLERK_ORG_SLUGS: blocks access and logs error
 */
export const TenantGuard: React.FC<TenantGuardProps> = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { userMemberships, isLoaded: orgListLoaded, setActive } = useOrganizationList({
    userMemberships: {
      infinite: true,
    }
  });
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkTenantAccess = async () => {
      // Wait for Clerk to load
      if (!userLoaded || !orgListLoaded) return;

      // If user is not authenticated, allow normal flow (routes handle sign-in)
      if (!user) {
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Parse allowed org slugs from env (comma-separated)
      const allowedSlugsRaw = env.ALLOWED_CLERK_ORG_SLUGS?.trim();
      const allowedSlugs = allowedSlugsRaw 
        ? allowedSlugsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      // PRODUCTION SAFETY: Block if no allowed orgs configured
      if (env.isProd && allowedSlugs.length === 0) {
        console.error('❌ CRITICAL: VITE_ALLOWED_CLERK_ORG_SLUGS not configured in production!');
        navigate('/unauthorized');
        return;
      }

      // DEV CONVENIENCE: Allow access if no orgs configured in development
      if (env.isDev && allowedSlugs.length === 0) {
        console.warn('⚠️ DEV MODE: No VITE_ALLOWED_CLERK_ORG_SLUGS set, allowing all users');
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Check if user belongs to any allowed organization
      const memberships = userMemberships?.data || [];
      const matchedMembership = memberships.find(membership => 
        allowedSlugs.includes(membership.organization.slug)
      );

      if (!matchedMembership) {
        // User doesn't belong to any allowed org - sign out and redirect
        console.warn('🚫 User not authorized for this deployment:', {
          userId: user.id,
          userOrgs: memberships.map(m => m.organization.slug),
          allowedOrgs: allowedSlugs
        });
        
        // Redirect to unauthorized (user will need to sign out manually)
        navigate('/unauthorized');
        return;
      }

      // User has access - set active org if not already active
      if (organization?.id !== matchedMembership.organization.id) {
        console.info('✅ Setting active organization:', matchedMembership.organization.slug);
        await setActive({ organization: matchedMembership.organization.id });
      }

      setIsChecking(false);
      setHasChecked(true);
    };

    if (!hasChecked) {
      checkTenantAccess();
    }
  }, [user, userLoaded, orgListLoaded, userMemberships, organization, navigate, hasChecked, setActive]);

  // Show loading state while checking
  if (isChecking || !userLoaded || !orgListLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
