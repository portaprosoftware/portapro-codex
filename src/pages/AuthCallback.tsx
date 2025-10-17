import React, { useEffect } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

/**
 * AuthCallback: Handles Clerk's OAuth redirect flow
 * 
 * IMPORTANT: Ensure the following in Clerk Dashboard:
 * - Add https://www.portaprosoftware.com/auth-redirect to "Authorized redirect URLs"
 * - Add preview URLs (e.g., https://[preview-id].lovableproject.com/auth-redirect)
 * - Set "After sign-in URL" to "/"
 * - Set "After sign-up URL" to "/"
 * - Verify custom domain is a subdomain (e.g., clerk.portaprosoftware.com), NOT root domain
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  // Guard: Only render Clerk callback when OAuth params are present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasOAuthParams = params.has('code') || params.has('__clerk_status') || params.has('state');
    
    if (!hasOAuthParams) {
      console.warn('AuthCallback: No OAuth params found, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="space-y-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
      <AuthenticateWithRedirectCallback 
        afterSignInUrl="/"
        afterSignUpUrl="/"
        continueSignUpUrl="/"
      />
    </div>
  );
};

export default AuthCallback;
