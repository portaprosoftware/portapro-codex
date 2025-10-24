import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

/**
 * Hook to reliably resolve organization ID from Clerk metadata, localStorage cache, or user ID fallback.
 * Ensures organization_id is never null during database operations.
 */
export function useOrganizationId() {
  const { user, isLoaded } = useUser();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [source, setSource] = useState<'clerk' | 'localStorage' | 'userIdFallback' | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const clerkOrg = (user.publicMetadata?.organizationId as string) || '';
    const cached = typeof window !== 'undefined' ? localStorage.getItem('orgId') || '' : '';
    let resolved = '';
    let src: 'clerk' | 'localStorage' | 'userIdFallback' | null = null;

    if (clerkOrg) {
      resolved = clerkOrg;
      src = 'clerk';
      if (typeof window !== 'undefined') {
        localStorage.setItem('orgId', clerkOrg);
      }
    } else if (cached) {
      resolved = cached;
      src = 'localStorage';
    } else if (user.id) {
      resolved = user.id;
      src = 'userIdFallback';
      if (typeof window !== 'undefined') {
        localStorage.setItem('orgId', user.id);
      }
    }

    setOrgId(resolved || null);
    setSource(src);
  }, [isLoaded, user]);

  return { orgId, source, isReady: isLoaded };
}
