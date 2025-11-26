import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUserRole } from './useUserRole';
import { useAuth, useOrganization } from '@clerk/clerk-react';
import { triggerNewTeamMemberNotification } from '@/utils/notificationTriggers';

type InviteUserRole = 'admin' | 'dispatcher' | 'driver' | 'customer';

interface InviteUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: InviteUserRole;
  phone?: string;
  organizationId?: string;
  organizationSlug?: string;
  redirectBase?: string;
}

interface InviteUserResponse {
  success: boolean;
  message?: string;
  data?: {
    userId?: string;
    profileId?: string;
    invitationId?: string;
    redirectUrl?: string;
    organizationId?: string;
    email?: string;
    role?: InviteUserRole;
  };
  error?: string;
}

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  const { user } = useUserRole();
  const { organization } = useOrganization();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (userData: InviteUserData): Promise<InviteUserResponse> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const invitePayload = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        organizationId: userData.organizationId || organization?.id,
        organizationSlug: userData.organizationSlug || organization?.slug,
        redirectBase: userData.redirectBase || (typeof window !== 'undefined' ? window.location.origin : undefined),
      };

      const sessionToken = await getToken();

      if (!sessionToken) {
        throw new Error('Unable to authenticate request');
      }

      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(invitePayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Failed to invite user';
        throw new Error(errorMsg);
      }

      console.log('✅ team invite success:', result);
      return result;
    },
    retry: (failureCount, error: any) => {
      const isNetworkError = error?.name === 'TypeError' || error?.message?.includes('Failed to fetch');
      const is5xxError = error?.status >= 500;

      return (isNetworkError || is5xxError) && failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000,
    onSuccess: async (data, variables) => {
      const email = data.data?.email || variables.email;
      toast.success(`Invitation sent successfully to ${email}`);
      
      // Trigger new team member notification
      if (data.data?.userId) {
        await triggerNewTeamMemberNotification({
          newUserId: data.data.userId,
          newUserName: `${variables.firstName} ${variables.lastName}`,
          newUserEmail: variables.email,
          role: variables.role,
          notifyTeam: true,
          notifyUserIds: [] // Will fetch owners/admins in edge function
        });
      }
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to invite user';
      console.error('❌ Invite user failed after retries:', errorMessage, error);
      toast.error(errorMessage);
    }
  });
};