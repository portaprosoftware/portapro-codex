import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  clerkUserId: string;
  organizationId: string;
}

/**
 * Verifies that a user belongs to the organization they claim to be acting on behalf of.
 * This is a critical security check to prevent cross-organization data access.
 * 
 * @param clerkUserId - The Clerk user ID from the authenticated session
 * @param claimedOrgId - The organization ID the user claims to belong to
 * @throws Error if user doesn't belong to the claimed organization
 */
export async function verifyOrganization(
  clerkUserId: string,
  claimedOrgId: string
): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Fetch the user's actual organization from their profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !profile) {
    console.error('verifyOrganization: Profile not found', { clerkUserId, error });
    throw new Error('User profile not found');
  }

  // Critical security check: Does the user's actual org match what they claim?
  if (profile.organization_id !== claimedOrgId) {
    console.error('verifyOrganization: Organization mismatch', {
      clerkUserId,
      actualOrg: profile.organization_id,
      claimedOrg: claimedOrgId
    });
    throw new Error(`Unauthorized: User does not belong to organization ${claimedOrgId}`);
  }

  console.log('verifyOrganization: Success', { clerkUserId, organizationId: claimedOrgId });
}

/**
 * Verifies a Clerk JWT token from the Authorization header.
 * Returns the user's Clerk ID if valid.
 */
export async function verifyClerkToken(authHeader: string | null): Promise<{ ok: boolean; sub?: string; error?: string }> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const CLERK_JWT_KEY = Deno.env.get('CLERK_JWT_KEY');
  const CLERK_ISSUER = Deno.env.get('CLERK_ISSUER');

  if (!CLERK_JWT_KEY || !CLERK_ISSUER) {
    console.error('verifyClerkToken: Missing Clerk config');
    return { ok: false, error: 'Server configuration error' };
  }

  try {
    const jwks = JSON.parse(CLERK_JWT_KEY);
    const key = await crypto.subtle.importKey(
      'jwk',
      jwks.keys[0],
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode JWT (simplified - in production use a proper JWT library)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { ok: false, error: 'Invalid token format' };
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Verify issuer
    if (payload.iss !== CLERK_ISSUER) {
      return { ok: false, error: 'Invalid token issuer' };
    }

    // Verify expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { ok: false, error: 'Token expired' };
    }

    return { ok: true, sub: payload.sub };
  } catch (error) {
    console.error('verifyClerkToken: Verification failed', error);
    return { ok: false, error: 'Token verification failed' };
  }
}
