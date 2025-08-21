
import { useUser } from '@clerk/clerk-react';

export type AppRole = 'owner' | 'dispatcher' | 'admin' | 'driver' | 'viewer' | 'unknown';

export function useUserRole() {
  const { user } = useUser();

  const role = (user?.publicMetadata?.role as AppRole) || 'unknown';

  const isOwner = role === 'owner';
  const isDispatcher = role === 'dispatcher';
  const canViewCustomerDocs = isOwner || isDispatcher;

  return {
    role,
    isOwner,
    isDispatcher,
    canViewCustomerDocs,
    userId: user?.id || null,
  };
}
