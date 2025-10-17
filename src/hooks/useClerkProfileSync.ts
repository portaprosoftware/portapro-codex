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
      console.log('🔄 Starting profile sync for:', userData.clerkUserId);

      // PRIMARY METHOD: Direct Supabase insert (most reliable)
      try {
        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', userData.clerkUserId)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Error checking existing profile:', checkError);
          throw checkError;
        }

        let profileId = existingProfile?.id as string | null;

        // Create profile if it doesn't exist
        if (!profileId) {
          console.log('➕ Creating new profile...');
          const { data: insertedProfile, error: insertError } = await supabase
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

          if (insertError) {
            console.error('❌ Profile insert failed:', insertError);
            throw insertError;
          }

          profileId = insertedProfile?.id as string | null;
          console.log('✅ Profile created:', profileId);
        } else {
          console.log('✅ Profile already exists:', profileId);
        }

        if (!profileId) {
          throw new Error('Failed to get profile ID');
        }

        // Handle role assignment
        const { data: existingRole, error: roleCheckError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profileId)
          .maybeSingle();

        if (roleCheckError) {
          console.error('❌ Error checking role:', roleCheckError);
        }

        // Assign role
        if (userData.clerkRole) {
          // User has a role from Clerk metadata - use it
          if (!existingRole || (existingRole as any).role !== userData.clerkRole) {
            console.log('🔑 Setting role from Clerk:', userData.clerkRole);
            await supabase.from('user_roles').delete().eq('user_id', profileId);
            await supabase.from('user_roles').insert({ 
              user_id: profileId, 
              role: userData.clerkRole as any 
            });
          }
        } else if (!existingRole) {
          // No Clerk role and no DB role - check if this is the first user
          const { data: owners, error: ownersError } = await supabase
            .from('user_roles')
            .select('id')
            .eq('role', 'owner')
            .limit(1);

          if (ownersError) {
            console.error('❌ Error checking owners:', ownersError);
          }

          if (!owners || owners.length === 0) {
            console.log('👑 First user - assigning owner role');
            await supabase.from('user_roles').insert({ 
              user_id: profileId, 
              role: 'owner' 
            });
          } else {
            console.warn('⚠️ No role assigned and not first user');
          }
        }

        console.log('✅ Profile sync complete:', { profileId });
        return profileId;

      } catch (directError) {
        console.error('❌ Direct profile creation failed:', directError);
        throw directError;
      }
    },
    onError: (error) => {
      console.error('❌ Profile sync failed:', error);
      toast.error('Failed to sync profile. Please contact support.');
    },
    onSuccess: (profileId) => {
      console.log('✅ Profile sync successful:', profileId);
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