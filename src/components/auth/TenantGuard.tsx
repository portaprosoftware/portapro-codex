import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { EnsureActiveOrg } from './EnsureActiveOrg';

interface TenantGuardProps {
  children: React.ReactNode;
}

/**
 * TenantGuard: Subdomain-specific multi-tenant isolation
 * 
 * Responsibilities:
 * - Validate user belongs to subdomain organization
 * - Enforce Clerk active organization via EnsureActiveOrg
 * - Redirect to /unauthorized if tenant resolution fails
 * 
 * Does NOT handle:
 * - Main domain redirects (handled by RootRedirect)
 * - Membership pre-validation (Clerk handles via setActive)
 * 
 * Flow:
 * 1. User signed in? → Yes
 * 2. Subdomain org exists? → Yes
 * 3. FAST PATH: org.slug === subdomain → Allow immediately
 * 4. Ensure Clerk active org matches tenant (EnsureActiveOrg)
 * 5. If activation fails → Navigate to /unauthorized
 */
export const TenantGuard: React.FC<TenantGuardProps> = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const navigate = useNavigate();
  const { subdomain, organization: subdomainOrg, isLoading: orgLookupLoading, isLocalhost, isMainDomain } = useOrganizationContext();
  
  // Skip checks on public routes
  const currentPath = window.location.pathname;
  const isPublicRoute = currentPath === '/unauthorized' ||
                        currentPath === '/no-portal-found' ||
                        currentPath === '/auth' ||
                        currentPath.startsWith('/auth/') ||
                        currentPath.startsWith('/public') ||
                        currentPath.startsWith('/onboarding');

  // WAIT until everything is loaded
  if (!userLoaded || !orgLoaded || orgLookupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow public routes without checks
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If user is not signed in → back to marketing site
  if (!user) {
    window.location.href = 'https://www.portaprosoftware.com';
    return null;
  }

  // Main domain: should not reach here (RootRedirect handles this)
  // If we somehow get here, redirect back to root for RootRedirect to handle
  if (isMainDomain) {
    navigate('/', { replace: true });
    return null;
  }

  // Localhost: allow access (development mode)
  if (isLocalhost) {
    return <>{children}</>;
  }

  // If no subdomain org found → show no-portal-found
  if (
    !subdomain ||
    !subdomainOrg ||
    !subdomainOrg.id ||
    subdomainOrg.subdomain !== subdomain
  ) {
    navigate('/no-portal-found', { replace: true });
    return null;
  }

  // All checks passed - allow access with enforced Clerk context
  return (
    <EnsureActiveOrg>
      {children}
    </EnsureActiveOrg>
  );
};
