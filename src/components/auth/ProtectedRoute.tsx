import React from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { TenantGuard } from './TenantGuard';
import { Layout } from '../layout/Layout';

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
  return (
    <>
      <SignedIn>
        <TenantGuard>
          <Layout>
            {children}
          </Layout>
        </TenantGuard>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/" />
      </SignedOut>
    </>
  );
};
