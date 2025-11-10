import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useOrganization, useClerk, useOrganizationList } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { useSubdomainOrg } from '@/hooks/useSubdomainOrg';

interface TenantGuardProps {
  children: React.ReactNode;
}

/**
 * TenantGuard: Multi-tenant isolation with setActive FIRST approach
 * 
 * Flow:
 * 1. User signed in?
 * 2. Look up subdomain → expected Clerk org ID
 * 3. FAST PATH: If current org.slug === subdomain → allow immediately
 * 4. SLOW PATH: Call setActive({ organization }) to switch context
 * 5. Only show unauthorized if setActive fails
 */
export const TenantGuard: React.FC<TenantGuardProps> = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { userMemberships, isLoaded: membershipLoaded } = useOrganizationList({
    userMemberships: { infinite: true }
  });
  const { setActive } = useClerk();
  const navigate = useNavigate();
  const { subdomain, organization: subdomainOrg, isLoading: orgLookupLoading, isLocalhost, isMainDomain } = useSubdomainOrg();
  
  const [isSettingActive, setIsSettingActive] = useState(false);

  // Skip checks on public routes
  const currentPath = window.location.pathname;
  const isPublicRoute = currentPath === '/unauthorized' || 
                        currentPath === '/no-portal-found' ||
                        currentPath === '/auth' || 
                        currentPath.startsWith('/auth/');

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

  // Main domain: redirect to first organization's subdomain
  if (isMainDomain) {
    if (!membershipLoaded) {
      return null;
    }
    const memberships = userMemberships?.data || [];
    if (memberships.length === 0) {
      navigate('/no-portal-found', { replace: true });
      return null;
    }
    // Use first organization membership to redirect
    const primaryOrg = memberships[0].organization;
    window.location.href = `https://${primaryOrg.slug}.portaprosoftware.com/dashboard`;
    return null;
  }

  // Localhost: allow access (development mode)
  if (isLocalhost) {
    return <>{children}</>;
  }

  // If no subdomain org found → show no-portal-found
  if (!subdomainOrg) {
    navigate('/no-portal-found', { replace: true });
    return null;
  }

  // FAST PATH: Current org already matches subdomain → allow immediately
  if (organization?.slug === subdomain) {
    return <>{children}</>;
  }

  // Activation: ensure Clerk active org matches subdomain BEFORE any checks
  const needsActivation = !!subdomainOrg && organization?.id !== subdomainOrg.clerk_org_id;

  useEffect(() => {
    if (!needsActivation || isSettingActive) return;

    let cancelled = false;
    const switchToOrg = async () => {
      try {
        setIsSettingActive(true);
        await setActive({ organization: subdomainOrg!.clerk_org_id });
      } catch (error) {
        if (!cancelled) {
          navigate('/unauthorized', { replace: true });
        }
      } finally {
        if (!cancelled) setIsSettingActive(false);
      }
    };

    switchToOrg();

    return () => {
      let _ = (cancelled = true);
    };
  }, [needsActivation, isSettingActive, setActive, subdomainOrg, navigate]);

  // While activating, don't render or redirect
  if (isSettingActive || needsActivation) {
    return null;
  }



  // All checks passed - allow access
  return <>{children}</>;
};
