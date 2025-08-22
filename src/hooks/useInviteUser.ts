import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRole } from './useUserRole';

interface InviteUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
}

interface InviteUserResponse {
  success: boolean;
  message: string;
  data?: {
    clerkUserId: string;
    invitationId: string;
    email: string;
    role: string;
    emailSent: boolean;
  };
  error?: string;
}

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  const { user } = useUserRole();

  return useMutation({
    mutationFn: async (userData: InviteUserData): Promise<InviteUserResponse> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          ...userData,
          invitedBy: user.id,
          environment: import.meta.env.DEV ? 'development' : 'production'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to invite user');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to invite user');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(
        data.data?.emailSent 
          ? `Invitation sent successfully to ${data.data.email}` 
          : `User created successfully, but welcome email failed to send to ${data.data?.email}`
      );
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error: Error) => {
      console.error('Invitation error:', error);
      toast.error(error.message || 'Failed to invite user');
    }
  });
};