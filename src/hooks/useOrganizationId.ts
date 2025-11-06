import { useOrganization } from '@clerk/clerk-react';

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

  return {
    orgId: organization?.id || null,
    orgSlug: organization?.slug || null,
    orgName: organization?.name || null,
    isReady: isLoaded,
  };
}
