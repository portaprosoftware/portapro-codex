import { useOrganization } from '@clerk/clerk-react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

/**
 * Hook to resolve organization ID from Clerk's native organization context.
 * This ensures multi-tenant data isolation by using actual Clerk organization IDs.
 * 
 * Returns:
 * - orgId: The Clerk organization ID (or null if not in an organization)
 * - orgSlug: The organization slug for URL-based routing
 * - orgName: The organization display name
 * - isReady: Whether Clerk has finished loading
 */
export function useOrganizationId() {
  const { organization, isLoaded } = useOrganization();
  const { organization: tenantOrganization, isLoading } = useOrganizationContext();

  return {
    orgId: tenantOrganization?.id || null,
    orgSlug: tenantOrganization?.subdomain || organization?.slug || null,
    orgName: tenantOrganization?.name || organization?.name || null,
    isReady: isLoaded && !isLoading,
  };
}
