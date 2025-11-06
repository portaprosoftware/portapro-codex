import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useOrganizationList, useOrganization } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { useClerkProfileSync } from '@/hooks/useClerkProfileSync';
import { Button } from '@/components/ui/button';

interface TenantGuardProps {
  children: React.ReactNode;
}

/**
 * TenantGuard: Wildcard Multi-tenant Subdomain Router
 * 
 * Enforces multi-tenant isolation using subdomain-based organization lookup.
 * 
 * Logic:
 * 1. Extract subdomain from hostname (e.g., smith-rentals.portaprosoftware.com → "smith-rentals")
 * 2. Query organizations table in Supabase for matching subdomain → clerk_org_id
 * 3. Verify user is a member of that Clerk organization
 * 4. If valid → set as active organization and render children
 * 5. If unknown subdomain → redirect to portaprosoftware.com (marketing site)
 * 6. If valid subdomain but user not member → redirect to /unauthorized
 * 7. Localhost development → allow access with organization selector
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

  // Use organization context (provides subdomain/org data globally)
  const { 
    subdomain, 
    organization: orgData, 
    isLoading: isLoadingOrg, 
    error: orgError,
    isLocalhost,
    isMainDomain 
  } = useOrganizationContext();

  // Profile sync - runs AFTER organization is set by TenantGuard
  const { isLoading: isSyncingProfile } = useClerkProfileSync();

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

      // Wait for Clerk and subdomain/org lookup to complete
      if (!userLoaded || !orgListLoaded || isLoadingOrg) return;

      // If user is not authenticated, allow normal flow (routes handle sign-in)
      if (!user) {
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Handle main domain: redirect to user's org subdomain
      if (isMainDomain) {
        console.info('🔄 Main domain detected. Redirecting to organization subdomain...');
        const firstMembership = userMemberships?.data?.[0];
        if (firstMembership?.organization?.slug) {
          window.location.href = `https://${firstMembership.organization.slug}.portaprosoftware.com/dashboard`;
          return;
        } else {
          console.error('❌ User has no organization memberships');
          navigate('/unauthorized');
          return;
        }
      }

      // Handle localhost without ?org= parameter: auto-select first org
      if (isLocalhost && !subdomain) {
        console.warn('⚠️ LOCALHOST DEV: No ?org= parameter. Using first available organization.');
        if (userMemberships?.data?.[0]) {
          const firstOrg = userMemberships.data[0].organization;
          console.info('✅ LOCALHOST: Setting first org as active:', firstOrg.slug);
          await setActive({ organization: firstOrg.id });
        }
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Handle organization lookup errors
      if (orgError || !orgData) {
        console.error('❌ Unknown subdomain:', subdomain, orgError);
        
        // Show toast before redirect
        toast.error('Organization Not Found', {
          description: `The subdomain "${subdomain}" doesn't exist. Redirecting to PortaPro.com...`,
          duration: 5000,
        });
        
        // Delay redirect to let user see the message
        setTimeout(() => {
          if (!isLocalhost) {
            window.location.href = 'https://portaprosoftware.com';
          } else {
            navigate('/unauthorized');
          }
        }, 1000);
        return;
      }

      const expectedClerkOrgId = orgData.clerk_org_id;

      // Verify user is a member of this organization
      const memberships = userMemberships?.data || [];
      const matchedMembership = memberships.find(m => m.organization.id === expectedClerkOrgId);

      if (!matchedMembership) {
        console.warn('🚫 TENANT ACCESS DENIED:', {
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          requiredOrgId: expectedClerkOrgId,
          userMemberships: memberships.map(m => ({ 
            id: m.organization.id, 
            slug: m.organization.slug 
          })),
          subdomain
        });
        
        // If user has other organizations, redirect to their first org's subdomain
        if (memberships.length > 0) {
          const firstOrg = memberships[0].organization;
          console.info('🔄 Redirecting user to their organization:', firstOrg.slug);
          toast.info('Redirecting...', {
            description: `Taking you to ${firstOrg.name}`,
            duration: 3000,
          });
          setTimeout(() => {
            window.location.href = `https://${firstOrg.slug}.portaprosoftware.com/dashboard`;
          }, 1000);
          setIsChecking(false);
          setHasChecked(true);
          return;
        }
        
        // User has no organizations - show access denied screen
        toast.error(`Access Denied: ${orgData.name}`, {
          description: `You don't have permission to access ${orgData.name}. Contact your administrator.`,
          duration: 10000,
        });
        
        navigate('/unauthorized', { replace: true });
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Set active organization if not already active
      if (organization?.id !== expectedClerkOrgId) {
        console.info('✅ Setting active organization:', matchedMembership.organization.slug);
        await setActive({ organization: expectedClerkOrgId });
      }

      setIsChecking(false);
      setHasChecked(true);
    };

    if (!hasChecked) {
      checkTenantAccess();
    }
  }, [user, userLoaded, orgListLoaded, userMemberships, organization, navigate, hasChecked, setActive, isPublicRoute, subdomain, orgData, orgError, isLoadingOrg, isLocalhost, isMainDomain]);

  // Show loading state while checking
  if (isChecking || !userLoaded || !orgListLoaded || isLoadingOrg || isSyncingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {isLoadingOrg 
              ? 'Looking up organization...' 
              : isSyncingProfile 
              ? 'Syncing profile...'
              : 'Verifying membership...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
