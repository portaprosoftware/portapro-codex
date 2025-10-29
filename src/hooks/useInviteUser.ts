import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserRole } from './useUserRole';
import { useOrganization } from '@clerk/clerk-react';

interface InviteUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  organizationId?: string;
  redirectBase?: string;
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
  const { organization } = useOrganization();

  return useMutation({
    mutationFn: async (userData: InviteUserData): Promise<InviteUserResponse> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Automatically include organizationId from Clerk context if available
      const invitePayload = {
        ...userData,
        organizationId: userData.organizationId || organization?.id,
        invitedBy: user.id,
        environment: import.meta.env.DEV ? 'development' : 'production',
        redirectBase: window.location.origin
      };

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: invitePayload
      });

      if (error) {
        console.error('Edge Function error:', error);
        // Throw the actual error object to preserve type info for retry logic
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to invite user');
      }

      return data;
    },
    retry: (failureCount, error: any) => {
      // Retry up to 3 times for transient 5xx errors
      const isTransient = 
        error?.name === 'FunctionsHttpError' ||
        error?.name === 'FunctionsFetchError' || 
        error?.message?.includes('Failed to send a request to the Edge Function') ||
        error?.message?.includes('non-2xx status code');
      
      return isTransient && failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.pow(2, attemptIndex) * 1000;
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
    onError: (error: any) => {
      // Parse the Edge Function's JSON error message if available
      let errorMessage = 'Failed to invite user';
      
      if (error?.context?.body) {
        // FunctionsHttpError includes the response body in context
        try {
          const body = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body;
          errorMessage = body?.message || body?.error || errorMessage;
        } catch (e) {
          // Fall back to default message
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      console.error('❌ Invite user failed after retries:', errorMessage, error);
      
      // Show single toast with the actual error from the Edge Function
      toast.error(errorMessage);
    }
  });
};