import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClerkProfileSync = () => {
  const { user, isLoaded } = useUser();
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
        }
      });

      if (error) {
        console.error('❌ Profile sync edge function error:', error);
        throw new Error(error.message || 'Failed to sync profile');
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
    onError: (error: any) => {
      console.error('❌ Profile sync error:', error);
      
      // Detect network/CORS errors and show a softer message
      const isCorsOrNetworkError = 
        error?.name === 'FunctionsFetchError' || 
        error?.message?.includes('Failed to send a request to the Edge Function') ||
        error?.message?.includes('CORS') ||
        error?.message?.includes('network');
      
      if (isCorsOrNetworkError) {
        retryCountRef.current += 1;
        
        if (retryCountRef.current >= maxRetries) {
          console.error('🛑 Profile sync failed after max retries. Edge functions may not be deployed.');
          hasSyncedRef.current = true; // Stop further retries
        } else {
          const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
          console.warn(`⏳ Sync retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
        }
      } else {
        toast.error('Unable to sync profile. Please try again.');
      }
    },
    onSuccess: (data) => {
      if (data?.profileId) {
        console.log('✅ Profile sync successful:', { profileId: data.profileId, role: data.role });
      }
    }
  });

  useEffect(() => {
    if (isLoaded && user && !hasSyncedRef.current) {
      // Sync profile with role from Clerk publicMetadata
      syncProfileMutation.mutate({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl,
        clerkRole: user.publicMetadata?.role as string | undefined,
      });
    }
  }, [isLoaded, user?.id]);

  return {
    isLoading: syncProfileMutation.isPending,
    error: syncProfileMutation.error,
    isSynced,
    hasSyncedRef
  };
};