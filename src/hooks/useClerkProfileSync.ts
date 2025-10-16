import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClerkProfileSync = () => {
  const { user, isLoaded } = useUser();
  const hasSyncedRef = useRef(false);

  const syncProfileMutation = useMutation({
    mutationFn: async (userData: {
      clerkUserId: string;
      email: string;
      firstName: string;
      lastName: string;
      imageUrl?: string;
      clerkRole?: string;
    }) => {
      // Step 1: Sync basic profile data
      const { data: profileId, error } = await supabase.rpc('sync_clerk_profile', {
        clerk_user_id_param: userData.clerkUserId,
        email_param: userData.email,
        first_name_param: userData.firstName,
        last_name_param: userData.lastName,
        image_url_param: userData.imageUrl || null
      });

      if (error) throw error;

      // Step 2: Sync role from Clerk to Supabase if provided
      if (userData.clerkRole && profileId) {
        const { data: currentRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profileId)
          .single();

        // If Clerk has a role and it differs from Supabase, sync it
        if (!currentRole || currentRole.role !== userData.clerkRole) {
          console.log('Syncing role from Clerk:', userData.clerkRole);
          
          // Delete existing role
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', profileId);

          // Insert new role
          await supabase
            .from('user_roles')
            .insert({
              user_id: profileId,
              role: userData.clerkRole as any,
            });
        }
      }

      // Dev-only safeguard: Auto-grant owner if no owners exist
      if (import.meta.env.DEV && profileId) {
        const { data: owners } = await supabase
          .from('user_roles')
          .select('id')
          .eq('role', 'owner')
          .limit(1);

        if (!owners || owners.length === 0) {
          console.log('DEV: No owners found. Auto-granting owner role to current user.');
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', profileId);
          
          await supabase
            .from('user_roles')
            .insert({
              user_id: profileId,
              role: 'owner',
            });
        }
      }

      return profileId;
    },
    onError: (error) => {
      console.error('Failed to sync profile:', error);
      toast.error('Failed to sync profile with database');
    }
  });

  useEffect(() => {
    if (isLoaded && user && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      
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
    error: syncProfileMutation.error
  };
};