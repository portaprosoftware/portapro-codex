import { useEffect, useRef, useState } from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClerkProfileSync = () => {
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();
  const [isSynced, setIsSynced] = useState(false);
  const hasSyncedRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 4;

  const syncProfileMutation = useMutation({
    mutationFn: async (userData: {
      clerkUserId: string;
      email: string;
      firstName: string;
      lastName: string;
      imageUrl?: string;
      clerkRole?: string;
      organizationId?: string;
    }) => {
      // Check sessionStorage to prevent duplicate sync attempts
      const syncKey = `clerk_sync_done:${userData.clerkUserId}`;
      if (typeof window !== 'undefined' && sessionStorage.getItem(syncKey)) {
        console.log('⏭️ Sync already completed for this session:', userData.clerkUserId);
        hasSyncedRef.current = true;
        setIsSynced(true);
        return { success: true, profileId: null, role: null };
      }

      console.log('🔄 Starting profile sync via edge function for:', userData.clerkUserId);

      // Call the profile_sync edge function instead of direct Supabase writes
      const { data, error } = await supabase.functions.invoke('profile_sync', {
        body: {
          clerkUserId: userData.clerkUserId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
          clerkRole: userData.clerkRole,
          organizationId: userData.organizationId, // Pass actual Clerk org ID
        }
      });

      if (error) {
        console.error('❌ Profile sync edge function error:', error);
        throw error; // Throw the actual error object to preserve type info
      }

      if (!data?.success) {
        console.error('❌ Profile sync failed:', data?.error);
        throw new Error(data?.error || 'Profile sync failed');
      }

      // Mark sync as complete in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(syncKey, 'true');
      }

      hasSyncedRef.current = true;
      setIsSynced(true);

      console.log('✅ Profile sync complete via edge function:', {
        profileId: data.profileId,
        role: data.role
      });

      return data;
    },
    retry: (failureCount, error: any) => {
      // Check if it's a transient 5xx error from edge function
      const isTransient = 
        error?.name === 'FunctionsHttpError' ||
        error?.name === 'FunctionsFetchError' || 
        error?.message?.includes('Failed to send a request to the Edge Function') ||
        error?.message?.includes('CORS') ||
        error?.message?.includes('network') ||
        error?.message?.includes('non-2xx status code');
      
      // Retry up to maxRetries for transient errors
      return isTransient && failureCount < maxRetries;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s
      return Math.pow(2, attemptIndex) * 1000;
    },
    onError: (error: any, variables, context) => {
      console.error('❌ Profile sync error after retries:', error);
      
      // Only show toast if it's not a transient error (those are retried automatically)
      const isTransient = 
        error?.name === 'FunctionsHttpError' ||
        error?.name === 'FunctionsFetchError' || 
        error?.message?.includes('Failed to send a request to the Edge Function') ||
        error?.message?.includes('CORS') ||
        error?.message?.includes('network') ||
        error?.message?.includes('non-2xx status code');
      
      if (isTransient) {
        console.error('🛑 Profile sync failed after max retries. Edge functions may not be deployed or database schema is missing.');
      } else {
        toast.error('Unable to sync profile. Please try again.');
      }
      
      hasSyncedRef.current = true; // Stop further attempts
    },
    onSuccess: (data) => {
      if (data?.profileId) {
        console.log('✅ Profile sync successful:', { profileId: data.profileId, role: data.role });
      }
    }
  });

  useEffect(() => {
    if (isLoaded && user && !hasSyncedRef.current) {
      // Sync profile with role and organization ID from Clerk
      syncProfileMutation.mutate({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl,
        clerkRole: user.publicMetadata?.role as string | undefined,
        organizationId: organization?.id, // Pass actual Clerk organization ID
      });
    }
  }, [isLoaded, user?.id, organization?.id]);

  return {
    isLoading: syncProfileMutation.isPending,
    error: syncProfileMutation.error,
    isSynced,
    hasSyncedRef
  };
};