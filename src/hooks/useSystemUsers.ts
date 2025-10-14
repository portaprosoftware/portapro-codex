import { useQuery } from '@tanstack/react-query';
import { useUser as useClerkUser } from '@clerk/clerk-react';

export interface SystemUser {
  id: string;
  name: string;
  email?: string;
}

export function useSystemUsers() {
  const { user: currentUser } = useClerkUser();

  return useQuery<SystemUser[]>({
    queryKey: ['system-users'],
    queryFn: async () => {
      // For now, return the current user as an option
      // In a full implementation, you would fetch all organization members from Clerk
      const users: SystemUser[] = [];
      
      if (currentUser) {
        users.push({
          id: currentUser.id,
          name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.emailAddresses[0]?.emailAddress || 'Current User',
          email: currentUser.emailAddresses[0]?.emailAddress,
        });
      }
      
      return users;
    },
    enabled: !!currentUser,
  });
}
