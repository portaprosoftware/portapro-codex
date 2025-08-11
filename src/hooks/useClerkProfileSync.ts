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
    }) => {
      const { data, error } = await supabase.rpc('sync_clerk_profile', {
        clerk_user_id_param: userData.clerkUserId,
        email_param: userData.email,
        first_name_param: userData.firstName,
        last_name_param: userData.lastName,
        image_url_param: userData.imageUrl || null
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error('Failed to sync profile:', error);
      toast.error('Failed to sync profile with database');
    }
  });

  useEffect(() => {
    if (isLoaded && user) {
      // Sync profile when user loads or changes
      syncProfileMutation.mutate({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl
      });
    }
  }, [isLoaded, user?.id, user?.firstName, user?.lastName, user?.imageUrl]);

  return {
    isLoading: syncProfileMutation.isPending,
    error: syncProfileMutation.error
  };
};