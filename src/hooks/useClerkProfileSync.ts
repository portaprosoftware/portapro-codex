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
      // PRIMARY: Try RPC first (most reliable in production)
      try {
        const { data: profileId, error } = await supabase.rpc('sync_clerk_profile', {
          clerk_user_id_param: userData.clerkUserId,
          email_param: userData.email,
          first_name_param: userData.firstName,
          last_name_param: userData.lastName,
          image_url_param: userData.imageUrl || null,
        });

        if (error) throw error;

        // After RPC success, ensure role exists and matches Clerk
        if (profileId) {
          const { data: currentRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profileId)
            .maybeSingle();

          // If Clerk provides a role, sync it
          if (userData.clerkRole) {
            if (!currentRole || (currentRole as any).role !== userData.clerkRole) {
              await supabase.from('user_roles').delete().eq('user_id', profileId);
              await supabase.from('user_roles').insert({ user_id: profileId, role: userData.clerkRole as any });
            }
          } else if (!currentRole) {
            // No Clerk role and no DB role: seed first owner
            const { data: owners } = await supabase
              .from('user_roles')
              .select('id')
              .eq('role', 'owner')
              .limit(1);

            if (!owners || owners.length === 0) {
              await supabase.from('user_roles').insert({ user_id: profileId, role: 'owner' });
              console.info('useClerkProfileSync: Auto-seeded first owner');
            }
          }

          console.info('useClerkProfileSync: RPC sync success', { profileId });
          return profileId;
        }

        throw new Error('RPC returned no profile ID');
      } catch (rpcError) {
        console.warn('useClerkProfileSync: RPC failed, trying edge function', rpcError);
      }

      // FALLBACK 1: Try edge function
      try {
        const { data, error } = await supabase.functions.invoke('profile_sync', {
          body: {
            clerkUserId: userData.clerkUserId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            imageUrl: userData.imageUrl,
            clerkRole: userData.clerkRole,
          },
        });

        if (!error && data?.success) {
          console.info('useClerkProfileSync: Edge function success', data);
          return data.profileId;
        }
        
        throw new Error(error?.message || 'Edge function failed');
      } catch (edgeError) {
        console.warn('useClerkProfileSync: Edge function failed, trying direct upsert', edgeError);
      }

      // FALLBACK 2: Direct upsert (last resort)
      try {
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

        if (!profileId) throw new Error('Direct upsert failed to get profile ID');

        // Ensure role
        if (userData.clerkRole) {
          await supabase.from('user_roles').delete().eq('user_id', profileId);
          await supabase.from('user_roles').insert({ user_id: profileId, role: userData.clerkRole as any });
        }

        console.info('useClerkProfileSync: Direct upsert success', { profileId });
        return profileId;
      } catch (fallbackError) {
        console.error('useClerkProfileSync: All sync methods failed', fallbackError);
        throw fallbackError;
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