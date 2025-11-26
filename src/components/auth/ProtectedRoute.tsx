import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TenantGuard } from './TenantGuard';
import { Layout } from '../layout/Layout';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectUrl?: string;
}

/**
 * ProtectedRoute: Combines authentication, tenant validation, and layout
 * 
 * This wrapper ensures:
 * 1. User is signed in (via Clerk)
 * 2. User belongs to allowed organization (via TenantGuard)
 * 3. Content is wrapped in standard Layout
 * 
 * Usage:
 * <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectUrl
}) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { organization, subdomain, isLoading: orgIsLoading, isMainDomain, isLocalhost } = useOrganizationContext();
  const location = useLocation();

  const returnUrl =
    redirectUrl || `${location.pathname}${location.search}${location.hash}`;

  if (!isLoaded || orgIsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    const target = `/auth?redirect_url=${encodeURIComponent(returnUrl)}`;
    return <Navigate to={target} replace />;
  }

  const onTenantSubdomain = !isMainDomain && !isLocalhost;

  if (onTenantSubdomain && (!organization || !subdomain)) {
    return <Navigate to="/no-portal-found" replace />;
  }

  return (
    <TenantGuard>
      <Layout>
        {children}
      </Layout>
    </TenantGuard>
  );
};
