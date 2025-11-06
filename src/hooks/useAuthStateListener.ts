import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Global auth state listener that monitors Clerk sign-in/sign-out events
 * and cleans up session state to prevent logout persistence bugs
 */
export const useAuthStateListener = () => {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const previousSignedIn = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    // Track sign-out event: user was signed in, now signed out
    if (previousSignedIn.current === true && isSignedIn === false) {
      console.info('🔓 Sign-out detected - cleaning up session state');
      
      // Clear sessionStorage (org sync flags, redirect guards)
      sessionStorage.clear();
      
      // Clear React Query cache (company settings, timezones, etc.)
      queryClient.clear();
      
      // Redirect to marketing site
      window.location.href = 'https://www.portaprosoftware.com';
    }
    
    // Update the ref to track current state
    previousSignedIn.current = isSignedIn;
  }, [isSignedIn, queryClient]);
};
