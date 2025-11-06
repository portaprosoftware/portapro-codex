import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useOrganizationList, useOrganization } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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

      // STEP 1: Extract subdomain from hostname
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1');
      const isMainDomain = hostname === 'portaprosoftware.com' || hostname === 'www.portaprosoftware.com';
      
      let subdomain: string | null = null;
      
      if (isLocalhost) {
        // Localhost development: Use query param or first available org
        const urlParams = new URLSearchParams(window.location.search);
        subdomain = urlParams.get('org') || null;
        
        if (!subdomain) {
          console.warn('⚠️ LOCALHOST DEV: No ?org= parameter. Using first available organization.');
          // Allow access with first available org in localhost
          if (userMemberships?.data?.[0]) {
            const firstOrg = userMemberships.data[0].organization;
            console.info('✅ LOCALHOST: Setting first org as active:', firstOrg.slug);
            await setActive({ organization: firstOrg.id });
          }
          setIsChecking(false);
          setHasChecked(true);
          return;
        }
      } else if (isMainDomain) {
        // Main domain: redirect authenticated users to their org subdomain
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
      } else {
        // Extract subdomain from production hostname
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          subdomain = parts[0]; // e.g., "smith-rentals" from "smith-rentals.portaprosoftware.com"
        } else {
          console.error('❌ Invalid hostname format:', hostname);
          window.location.href = 'https://portaprosoftware.com';
          return;
        }
      }

      // STEP 2: Query organizations table for matching subdomain
      console.log('🔍 Looking up organization for subdomain:', subdomain);
      
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('clerk_org_id, name, subdomain, is_active')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (orgError || !orgData) {
        console.error('❌ Unknown subdomain:', subdomain, orgError);
        // Unknown subdomain → redirect to marketing site
        if (!isLocalhost) {
          window.location.href = 'https://portaprosoftware.com';
        } else {
          navigate('/unauthorized');
        }
        return;
      }

      const expectedClerkOrgId = orgData.clerk_org_id;
      console.log('✅ Found organization:', {
        name: orgData.name,
        subdomain: orgData.subdomain,
        clerkOrgId: expectedClerkOrgId
      });

      // STEP 3: Verify user is a member of this organization
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
        
        navigate('/unauthorized', { replace: true });
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // STEP 4: Set active organization if not already active
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
  }, [user, userLoaded, orgListLoaded, userMemberships, organization, navigate, hasChecked, setActive, isPublicRoute]);

  // Show loading state while checking
  if (isChecking || !userLoaded || !orgListLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Looking up organization...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
