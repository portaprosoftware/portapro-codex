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

  // Cleanup: Clear old sync flags when organization changes
  useEffect(() => {
    if (organization?.id) {
      const allKeys = Object.keys(sessionStorage);
      const oldSyncKeys = allKeys.filter(k => k.startsWith('clerk_sync_done:'));
      oldSyncKeys.forEach(key => {
        // Keep only the current user's sync flag
        if (!key.includes(user?.id || '')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, [organization?.id, user?.id]);

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
        
        // Detect 403 Forbidden (missing organization)
        if (error.message?.includes('403')) {
          throw new Error('MISSING_ORGANIZATION');
        }
        
        throw error; // Throw the actual error object to preserve type info
      }

      if (!data?.success) {
        console.error('❌ Profile sync failed:', data?.error);
        
        // Check if it's the missing organization error code
        if (data?.code === 'MISSING_ORGANIZATION') {
          throw new Error('MISSING_ORGANIZATION');
        }
        
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
      // NEVER retry 403 errors (missing organization is not transient)
      if (error?.message === 'MISSING_ORGANIZATION' || error?.message?.includes('403')) {
        return false;
      }

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
      
      // Handle missing organization error specifically
      if (error?.message === 'MISSING_ORGANIZATION') {
        toast.error('Please join an organization to access PortaPro', {
          description: 'Contact your administrator or visit your organization subdomain.',
          duration: 10000,
        });
        hasSyncedRef.current = true;
        return;
      }
      
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
      // DEFENSIVE: Only sync if we have an organization
      if (!organization?.id) {
        console.warn('⚠️ Profile sync skipped: No active organization yet');
        return;
      }

      console.log('🔄 Profile sync triggered:', {
        userId: user.id,
        organizationId: organization.id,
        organizationSlug: organization.slug,
      });

      // Sync profile with role and organization ID from Clerk
      syncProfileMutation.mutate({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl,
        clerkRole: user.publicMetadata?.role as string | undefined,
        organizationId: organization.id, // Pass actual Clerk organization ID
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