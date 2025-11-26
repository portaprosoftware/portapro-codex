import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractOrgSlug } from '../../lib/getOrgFromHost';
import { getAppRootUrl, getMarketingUrl, getRootDomain } from '@/lib/config/domains';

interface OrganizationData {
  id: string;
  clerk_org_id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
}

interface UseSubdomainOrgReturn {
  subdomain: string | null;
  organization: OrganizationData | null;
  isLoading: boolean;
  error: Error | null;
  isLocalhost: boolean;
  isMainDomain: boolean;
}

/**
 * useSubdomainOrg - Extracts subdomain and looks up organization data
 * 
 * Handles:
 * - Subdomain extraction from hostname
 * - Localhost detection with ?org= query param support
 * - Main domain detection (marketing + app hostnames)
 * - Organization lookup in Supabase
 * 
 * @returns {UseSubdomainOrgReturn} Organization data, subdomain, loading state, and error
 * 
 * @example
 * const { subdomain, organization, isLoading } = useSubdomainOrg();
 * 
 * if (isLoading) return <Loader />;
 * if (!organization) return <NotFound />;
 * 
 * return <Dashboard org={organization} />;
 */
export const useSubdomainOrg = (): UseSubdomainOrgReturn => {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isMainDomain, setIsMainDomain] = useState(false);

  useEffect(() => {
    const extractAndLookup = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // STEP 1: Extract subdomain from hostname
        const hostname = window.location.hostname;
        const localhostDetected = hostname === 'localhost' || hostname.startsWith('127.0.0.1');

        const rootDomain = getRootDomain();
        const marketingHostname = new URL(getMarketingUrl()).hostname;
        const appHostname = new URL(getAppRootUrl()).hostname;

        const marketingHosts = new Set([
          rootDomain,
          `www.${rootDomain}`,
          marketingHostname,
        ]);

        const mainDomainDetected = marketingHosts.has(hostname);
        const appDomainDetected = hostname === appHostname;
        
        setIsLocalhost(localhostDetected);
        setIsMainDomain(mainDomainDetected || appDomainDetected);

        let extractedSubdomain: string | null = null;

        if (localhostDetected) {
          // Localhost development: Check for ?org= query parameter
          const urlParams = new URLSearchParams(window.location.search);
          extractedSubdomain = urlParams.get('org') || null;

          console.info('🔧 LOCALHOST DEV:', { subdomain: extractedSubdomain });
        } else if (mainDomainDetected || appDomainDetected) {
          // Main domain: No subdomain extraction needed
          console.info('🏠 MAIN DOMAIN detected');
          setSubdomain(null);
          setIsLoading(false);
          return;
        } else {
          // Production: Extract subdomain from hostname using shared utility
          extractedSubdomain = extractOrgSlug(hostname);

          if (!extractedSubdomain) {
            throw new Error(`Invalid hostname format: ${hostname}`);
          }
        }

        setSubdomain(extractedSubdomain);

        // STEP 2: Lookup organization in Supabase (if subdomain exists)
        if (extractedSubdomain) {
          console.log('🔍 Looking up organization for subdomain:', extractedSubdomain);

          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id, clerk_org_id, name, subdomain, is_active')
            .eq('subdomain', extractedSubdomain)
            .eq('is_active', true)
            .maybeSingle();

          if (orgError) {
            // Supabase returns an error if multiple rows match even with maybeSingle
            if (orgError.code === 'PGRST116') {
              throw new Error(`Multiple organizations found for subdomain: ${extractedSubdomain}`);
            }

            throw new Error(`Organization lookup failed: ${orgError.message}`);
          }

          if (!orgData) {
            setOrganization(null);
            throw new Error(`No active organization found for subdomain: ${extractedSubdomain}`);
          }

          console.log('✅ Found organization:', {
            name: orgData.name,
            subdomain: orgData.subdomain,
            clerkOrgId: orgData.clerk_org_id
          });

          setOrganization(orgData);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('❌ useSubdomainOrg error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    };

    extractAndLookup();
  }, []); // Run once on mount

  return {
    subdomain,
    organization,
    isLoading,
    error,
    isLocalhost,
    isMainDomain,
  };
};
