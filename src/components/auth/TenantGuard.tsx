import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useOrganization, useClerk } from '@clerk/clerk-react';
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
  const { setActive } = useClerk();
  const navigate = useNavigate();
  const { subdomain, organization: subdomainOrg, isLoading: orgLookupLoading, isLocalhost, isMainDomain } = useSubdomainOrg();
  
  const [isSettingActive, setIsSettingActive] = useState(false);
  const [hasAttemptedSetActive, setHasAttemptedSetActive] = useState(false);

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
    if (!organization) {
      navigate('/no-portal-found', { replace: true });
      return null;
    }
    window.location.href = `https://${organization.slug}.portaprosoftware.com/dashboard`;
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

  // FAST PATH: If current org already matches subdomain → allow immediately
  if (organization && organization.slug === subdomain) {
    return <>{children}</>;
  }

  // SLOW PATH: Try to setActive to the expected org
  // This runs when user is logged in but hasn't selected the right org yet
  useEffect(() => {
    if (hasAttemptedSetActive || isSettingActive || !subdomainOrg) return;
    if (organization && organization.slug === subdomain) return; // Already correct

    const switchToOrg = async () => {
      try {
        setIsSettingActive(true);
        console.log('🔄 Switching to organization:', subdomainOrg.clerk_org_id);
        
        await setActive({ organization: subdomainOrg.clerk_org_id });
        
        console.log('✅ Successfully switched to organization');
        setHasAttemptedSetActive(true);
      } catch (error) {
        console.error('❌ Failed to switch organization:', error);
        setHasAttemptedSetActive(true);
        navigate('/unauthorized', { replace: true });
      } finally {
        setIsSettingActive(false);
      }
    };

    switchToOrg();
  }, [subdomain, subdomainOrg, organization, hasAttemptedSetActive, isSettingActive, setActive, navigate]);

  // Show loading while switching orgs
  if (isSettingActive || (!hasAttemptedSetActive && organization?.slug !== subdomain)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Switching organization...</p>
        </div>
      </div>
    );
  }

  // If we've attempted setActive and still don't match → unauthorized
  if (hasAttemptedSetActive && organization?.slug !== subdomain) {
    navigate('/unauthorized', { replace: true });
    return null;
  }

  // All checks passed
  return <>{children}</>;
};
