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
      // Helper: Fallback to direct upsert when RPC fails in production
      const ensureProfileAndRole = async () => {
        try {
          // 1) Ensure profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('clerk_user_id', userData.clerkUserId)
            .maybeSingle();

          let profileId = existingProfile?.id as string | null;

          if (!profileId) {
            const { data: insertedProfile, error: insertProfileError } = await supabase
              .from('profiles')
              .insert({
                clerk_user_id: userData.clerkUserId,
                email: userData.email || null,
                first_name: userData.firstName || null,
                last_name: userData.lastName || null,
                image_url: userData.imageUrl || null,
              } as any)
              .select('id')
              .single();

            if (insertProfileError) throw insertProfileError;
            profileId = insertedProfile?.id as string | null;
          }

          if (!profileId) return null;

          // 2) Ensure role matches Clerk (if provided)
          if (userData.clerkRole) {
            await supabase
              .from('user_roles')
              .delete()
              .eq('user_id', profileId);

            await supabase
              .from('user_roles')
              .insert({
                user_id: profileId,
                role: userData.clerkRole as any,
              });
          }

          // 3) Dev-only safeguard: auto-grant owner if no owners exist
          if (import.meta.env.DEV) {
            const { data: owners } = await supabase
              .from('user_roles')
              .select('id')
              .eq('role', 'owner')
              .limit(1);

            if (!owners || owners.length === 0) {
              await supabase.from('user_roles').delete().eq('user_id', profileId);
              await supabase.from('user_roles').insert({ user_id: profileId, role: 'owner' });
            }
          }

          if (process.env.NODE_ENV !== 'production') {
            console.info('useClerkProfileSync: Fallback upsert success', { profileId });
          }

          return profileId;
        } catch (fallbackError) {
          console.error('useClerkProfileSync: Fallback upsert failed', fallbackError);
          return null;
        }
      };

      // Try primary RPC path first
      try {
        const { data: profileId, error } = await supabase.rpc('sync_clerk_profile', {
          clerk_user_id_param: userData.clerkUserId,
          email_param: userData.email,
          first_name_param: userData.firstName,
          last_name_param: userData.lastName,
          image_url_param: userData.imageUrl || null,
        });

        if (error) throw error;

        // After RPC, optionally sync role if Clerk provides one
        if (userData.clerkRole && profileId) {
          const { data: currentRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profileId)
            .maybeSingle();

          if (!currentRole || (currentRole as any).role !== userData.clerkRole) {
            await supabase.from('user_roles').delete().eq('user_id', profileId);
            await supabase.from('user_roles').insert({ user_id: profileId, role: userData.clerkRole as any });
          }
        }

        if (process.env.NODE_ENV !== 'production') {
          console.info('useClerkProfileSync: RPC sync success', { profileId });
        }

        // Dev-only safeguard: Auto-grant owner if no owners exist
        if (import.meta.env.DEV && profileId) {
          const { data: owners } = await supabase
            .from('user_roles')
            .select('id')
            .eq('role', 'owner')
            .limit(1);

          if (!owners || owners.length === 0) {
            await supabase.from('user_roles').delete().eq('user_id', profileId);
            await supabase.from('user_roles').insert({ user_id: profileId, role: 'owner' });
          }
        }

        return profileId;
      } catch (e) {
        // RPC failed (e.g., 401 in prod) → fallback
        const profileId = await ensureProfileAndRole();
        if (!profileId) throw e; // Bubble up if both paths fail
        return profileId;
      }
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