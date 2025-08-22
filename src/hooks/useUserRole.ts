
import { useUser } from '@clerk/clerk-react';

export type AppRole = 'owner' | 'dispatcher' | 'admin' | 'driver' | 'viewer' | 'unknown';

export function useUserRole() {
  const { user, isLoaded } = useUser();

  // Only determine role if user is fully loaded and exists
  const role = (isLoaded && user?.publicMetadata?.role as AppRole) || 'unknown';

  // Log current user info in development for debugging
  if (process.env.NODE_ENV === 'development' && isLoaded) {
    console.log('useUserRole - Current user:', {
      userId: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      role: user?.publicMetadata?.role,
      isLoaded
    });
  }

  const isOwner = role === 'owner';
  const isDispatcher = role === 'dispatcher';
  const isAdmin = role === 'admin';
  const isDriver = role === 'driver';
  // Temporarily allow all roles to access customer docs for testing
  const canViewCustomerDocs = true; // isOwner || isDispatcher;
  const hasAdminAccess = true; // isOwner || isDispatcher || isAdmin;
  const hasStaffAccess = isOwner || isDispatcher || isAdmin || isDriver;

  return {
    role,
    isOwner,
    isDispatcher,
    isAdmin,
    isDriver,
    canViewCustomerDocs,
    hasAdminAccess,
    hasStaffAccess,
    user,
    isLoaded,
    userId: user?.id || null,
  };
}
