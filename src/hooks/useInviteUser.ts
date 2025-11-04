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
  message?: string;
  data?: {
    id?: string;
    email_address?: string;
    email?: string;
    role?: string;
    role_name?: string;
    organization_id?: string;
    status?: string;
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
        email: userData.email,
        organizationId: userData.organizationId || organization?.id,
        org_slug: organization?.slug || organization?.name?.toLowerCase().replace(/\s+/g, '-') || 'default',
        org_name: organization?.name || 'Default Organization',
        role: userData.role,
        env: import.meta.env.DEV ? 'dev' : 'prod'
      };

      const { data, error } = await supabase.functions.invoke('org-invite', {
        body: invitePayload
      });

      if (error) {
        console.error('Edge Function error:', error);
        // Throw the actual error object to preserve type info for retry logic
        throw error;
      }

      // Normalize response (handle cases where Supabase client doesn't auto-parse JSON)
      const response = typeof data === 'string' ? JSON.parse(data) : data;

      if (!response.success) {
        const errorMsg = response.error || response.detail?.body || 'Failed to invite user';
        throw new Error(errorMsg);
      }

      console.log('✅ org-invite success:', response);
      return response;
    },
    retry: (failureCount, error: any) => {
      // Only retry on network/transient 5xx errors, not 400/404
      const isNetworkError = 
        error?.name === 'FunctionsFetchError' || 
        error?.message?.includes('Failed to send a request to the Edge Function');
      
      const is5xxError = error?.context?.statusCode >= 500;
      
      return (isNetworkError || is5xxError) && failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.pow(2, attemptIndex) * 1000;
    },
    onSuccess: (data) => {
      const email = data.data?.email_address || data.data?.email;
      toast.success(`Invitation sent successfully to ${email}`);
      
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
          
          // Extract Clerk error details if present
          if (body?.detail?.body) {
            const detail = typeof body.detail.body === 'string' 
              ? JSON.parse(body.detail.body) 
              : body.detail.body;
            errorMessage = detail?.errors?.[0]?.long_message || detail?.errors?.[0]?.message || body.error || errorMessage;
          } else {
            errorMessage = body?.message || body?.error || errorMessage;
          }
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