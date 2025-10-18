import { clearLastRoute } from '@/hooks/useLastRoute';

/**
 * Handle sign out: clear saved route and redirect to external Clerk sign-in
 */
export const handleSignOut = async (signOutFn: () => Promise<void>) => {
  // Clear the stored last route
  clearLastRoute();
  
  // Sign out from Clerk
  await signOutFn();
  
  // Redirect to external Clerk sign-in page
  window.location.href = 'https://accounts.portaprosoftware.com/sign-in';
};
