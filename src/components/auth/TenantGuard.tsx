import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

interface TenantGuardProps {
  children: React.ReactNode;
}

/**
 * TenantGuard: Simple subdomain-based tenant isolation
 * 
 * Waits for Clerk to hydrate, then checks:
 * 1. Is user signed in?
 * 2. Does user have an active organization?
 * 3. Does organization.slug match current subdomain?
 */
export const TenantGuard: React.FC<TenantGuardProps> = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const navigate = useNavigate();

  // Extract subdomain from hostname
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const subdomain = parts.length > 2 ? parts[0] : null;

  // Handle localhost development
  const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1');
  
  // Handle main domain (app.portaprosoftware.com or portaprosoftware.com)
  const isMainDomain = hostname === 'portaprosoftware.com' || 
                       hostname === 'app.portaprosoftware.com' ||
                       hostname === 'www.portaprosoftware.com';

  // Skip checks on public routes
  const currentPath = window.location.pathname;
  const isPublicRoute = currentPath === '/unauthorized' || 
                        currentPath === '/no-portal-found' ||
                        currentPath === '/auth' || 
                        currentPath.startsWith('/auth/');

  // WAIT until Clerk is fully hydrated
  if (!userLoaded || !orgLoaded) {
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
    // Redirect to their organization's subdomain
    window.location.href = `https://${organization.slug}.portaprosoftware.com/dashboard`;
    return null;
  }

  // Localhost: allow access (development mode)
  if (isLocalhost) {
    return <>{children}</>;
  }

  // If user is signed in but has no org → show no-portal-found
  if (!organization) {
    navigate('/no-portal-found', { replace: true });
    return null;
  }

  // If user has an org but it doesn't match the subdomain → unauthorized
  if (organization.slug !== subdomain) {
    console.warn('🚫 Org slug mismatch:', {
      expected: subdomain,
      actual: organization.slug,
      userId: user.id
    });
    navigate('/unauthorized', { replace: true });
    return null;
  }

  // All checks passed - render children
  return <>{children}</>;
};
