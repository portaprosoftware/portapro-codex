import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useClerkProfileSync = () => {
  const { user, isLoaded } = useUser();

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
        return null;
      }

      console.log('🔄 Starting profile sync for:', userData.clerkUserId);

      try {
        const profileId = crypto?.randomUUID?.() ?? self.crypto.randomUUID();

        // Check if profile already exists by Clerk user id
        const { data: existingProfile, error: selectError } = await supabase
          .from('profiles')
          .select('id')
          .eq('clerk_user_id', userData.clerkUserId)
          .maybeSingle();

        if (selectError) {
          console.error('❌ Profile select failed:', {
            code: selectError.code,
            message: selectError.message,
            details: selectError.details
          });
          throw selectError;
        }

        let finalProfileId: string;

        if (existingProfile?.id) {
          // Update existing profile WITHOUT changing the primary key
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email: userData.email || null,
              first_name: userData.firstName || null,
              last_name: userData.lastName || null,
              image_url: userData.imageUrl || null,
            })
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error('❌ Profile update failed:', {
              code: updateError.code,
              message: updateError.message,
              details: updateError.details
            });
            throw updateError;
          }

          finalProfileId = existingProfile.id;
          console.log('✅ Profile updated:', finalProfileId);
        } else {
          // Insert new profile with explicit id
          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: profileId,
              clerk_user_id: userData.clerkUserId,
              email: userData.email || null,
              first_name: userData.firstName || null,
              last_name: userData.lastName || null,
              image_url: userData.imageUrl || null,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('❌ Profile insert failed:', {
              code: insertError.code,
              message: insertError.message,
              details: insertError.details
            });
            throw insertError;
          }

          finalProfileId = inserted!.id as string;
          console.log('✅ Profile created:', finalProfileId);
        }


        // Handle role assignment
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', finalProfileId)
          .maybeSingle();

        // Assign role based on Clerk metadata or first-user logic
        if (userData.clerkRole) {
          // User has a role from Clerk metadata - use it
          if (!existingRole || (existingRole as any).role !== userData.clerkRole) {
            console.log('🔑 Setting role from Clerk metadata:', userData.clerkRole);
            await supabase.from('user_roles').delete().eq('user_id', finalProfileId);
            const { error: roleInsertError } = await supabase
              .from('user_roles')
              .insert({ 
                user_id: finalProfileId, 
                role: userData.clerkRole as any 
              });
            
            if (roleInsertError) {
              console.error('❌ Role insert failed:', roleInsertError);
            }
          }
        } else if (!existingRole) {
          // No Clerk role and no DB role - check if this is the first user
          const { data: owners } = await supabase
            .from('user_roles')
            .select('id')
            .eq('role', 'owner')
            .limit(1);

          if (!owners || owners.length === 0) {
            console.log('👑 First user - assigning owner role');
            const { error: ownerInsertError } = await supabase
              .from('user_roles')
              .insert({ 
                user_id: finalProfileId, 
                role: 'owner' 
              });
            
            if (ownerInsertError) {
              console.error('❌ Owner role insert failed:', ownerInsertError);
            }
          } else {
            console.warn('⚠️ No role assigned and not first user - admin must assign role');
          }
        }

        // Mark sync as complete in sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(syncKey, 'true');
        }

        console.log('✅ Profile sync complete');
        return finalProfileId;

      } catch (error: any) {
        console.error('❌ Profile sync failed:', {
          code: error?.code,
          message: error?.message,
          details: error?.details
        });
        throw error;
      }
    },
    onError: (error: any) => {
      console.error('❌ Profile sync error:', error);
      toast.error('Failed to sync your profile. Please refresh the page or contact support.');
    },
    onSuccess: (profileId) => {
      if (profileId) {
        console.log('✅ Profile sync successful:', profileId);
      }
    }
  });

  useEffect(() => {
    if (isLoaded && user) {
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