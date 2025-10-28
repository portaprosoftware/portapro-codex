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

  // CRITICAL: Skip tenant check on public routes to prevent redirect loops
  const currentPath = window.location.pathname;
  const isPublicRoute = currentPath === '/unauthorized' || currentPath === '/auth' || currentPath.startsWith('/auth/');

  useEffect(() => {
    const checkTenantAccess = async () => {
      // SAFETY: Don't run guard on public routes (prevents redirect loops)
      if (isPublicRoute) {
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Wait for Clerk to load
      if (!userLoaded || !orgListLoaded) return;

      // If user is not authenticated, allow normal flow (routes handle sign-in)
      if (!user) {
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Parse allowed org slugs/IDs from env (comma-separated)
      const allowedSlugsRaw = env.ALLOWED_CLERK_ORG_SLUGS?.trim() || '';
      const allowedValues = allowedSlugsRaw 
        ? allowedSlugsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      // Normalize: org IDs (org_xxx) stay as-is, slugs become lowercase
      const normalizedAllowed = allowedValues.map(v => 
        v.startsWith('org_') ? v : v.toLowerCase()
      );

      // DEBUG MODE: Activate with ?tenant_debug=1 (works in dev and prod)
      const debugMode = env.isDev || new URLSearchParams(window.location.search).get('tenant_debug') === '1';
      
      if (debugMode) {
        console.log('🔍 TENANT GUARD DEBUG:', {
          rawEnvValue: allowedSlugsRaw,
          parsedValues: allowedValues,
          normalizedAllowed,
          activeOrgId: organization?.id || null,
          activeOrgSlug: organization?.slug || null,
          userMemberships: (userMemberships?.data || []).map(m => ({
            id: m.organization.id,
            slug: m.organization.slug
          })),
          hostname: window.location.hostname,
          currentPath,
          debugModeActive: true
        });
      }

      // PRODUCTION SAFETY: Block if no allowed orgs configured
      if (env.isProd && normalizedAllowed.length === 0) {
        console.error('❌ CRITICAL: VITE_ALLOWED_CLERK_ORG_SLUGS not configured in production!');
        navigate('/unauthorized');
        return;
      }

      // DEV CONVENIENCE: Allow access if no orgs configured in development
      if (env.isDev && normalizedAllowed.length === 0) {
        console.warn('⚠️ DEV MODE: No VITE_ALLOWED_CLERK_ORG_SLUGS set, allowing all users');
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Check if user belongs to any allowed organization (match by slug OR id)
      const memberships = userMemberships?.data || [];
      const matchedMembership = memberships.find(membership => {
        const orgSlugLc = membership.organization.slug?.toLowerCase() || '';
        const orgId = membership.organization.id || '';
        return normalizedAllowed.includes(orgSlugLc) || normalizedAllowed.includes(orgId);
      });

      // FALLBACK: If no membership found, check if active organization matches
      // This handles cases where userMemberships might be empty but org context exists
      let hasAccess = !!matchedMembership;
      if (!matchedMembership && organization) {
        const activeSlug = organization.slug?.toLowerCase() || '';
        const activeId = organization.id || '';
        hasAccess = normalizedAllowed.includes(activeSlug) || normalizedAllowed.includes(activeId);
        
        if (debugMode && hasAccess) {
          console.info('✅ Access granted via active organization fallback:', {
            activeOrgId: activeId,
            activeOrgSlug: organization.slug
          });
        }
      }

      if (!hasAccess) {
        // User doesn't belong to any allowed org - redirect to unauthorized
        console.warn('🚫 TENANT ACCESS DENIED:', {
          rawEnvValue: allowedSlugsRaw,
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          activeOrgId: organization?.id || null,
          activeOrgSlug: organization?.slug || null,
          userMemberships: memberships.map(m => ({ id: m.organization.id, slug: m.organization.slug })),
          allowedNormalized: normalizedAllowed,
          deployment: window.location.hostname
        });
        
        // Redirect to unauthorized page
        navigate('/unauthorized', { replace: true });
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // User has access - set active org if not already active (only if we have a membership)
      if (matchedMembership && organization?.id !== matchedMembership.organization.id) {
        console.info('✅ Setting active organization:', matchedMembership.organization.slug);
        await setActive({ organization: matchedMembership.organization.id });
      }

      setIsChecking(false);
      setHasChecked(true);
    };

    if (!hasChecked) {
      checkTenantAccess();
    }
  }, [user, userLoaded, orgListLoaded, userMemberships, organization, navigate, hasChecked, setActive, isPublicRoute]);

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
