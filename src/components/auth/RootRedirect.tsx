import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizationList } from '@clerk/clerk-react';
import { useSubdomainOrg } from '@/hooks/useSubdomainOrg';

interface RootRedirectProps {
  children: React.ReactNode;
}

/**
 * RootRedirect: Main-domain → subdomain redirect handler
 * 
 * Responsibilities:
 * - Only runs on main domain (portaprosoftware.com, app.portaprosoftware.com)
 * - Redirects to user's primary organization subdomain
 * - Redirects to /no-portal-found if user has no organization memberships
 * - Passes through on subdomains (does nothing)
 * - Passes through on localhost (development bypass)
 * 
 * Flow:
 * 1. Detect main domain → wait for memberships → redirect to subdomain
 * 2. Detect subdomain → pass through (render children)
 * 3. Detect localhost → pass through (render children)
 */
export const RootRedirect: React.FC<RootRedirectProps> = ({ children }) => {
  const { userMemberships, isLoaded: membershipLoaded } = useOrganizationList({
    userMemberships: { infinite: true }
  });
  const navigate = useNavigate();
  const { isMainDomain, isLocalhost } = useSubdomainOrg();

  // Skip redirect on subdomains or localhost
  if (!isMainDomain || isLocalhost) {
    return <>{children}</>;
  }

  // Wait for memberships to load
  if (!membershipLoaded) {
    return null; // No UI, just wait
  }

  // Get user's organizations
  const memberships = userMemberships?.data || [];

  // No memberships → show no-portal-found
  if (memberships.length === 0) {
    navigate('/no-portal-found', { replace: true });
    return null;
  }

  // Redirect to first organization's subdomain
  const primaryOrg = memberships[0].organization;
  window.location.href = `https://${primaryOrg.slug}.portaprosoftware.com/dashboard`;
  return null;
};
