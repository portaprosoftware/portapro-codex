
import { useUser } from '@clerk/clerk-react';

export type AppRole = 'owner' | 'dispatcher' | 'admin' | 'driver' | 'viewer' | 'unknown';

export function useUserRole() {
  const { user, isLoaded } = useUser();

  const role = (user?.publicMetadata?.role as AppRole) || 'unknown';

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
