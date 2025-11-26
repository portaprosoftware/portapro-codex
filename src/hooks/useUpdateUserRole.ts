import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clerkUserId, role }: { clerkUserId: string; role: string }) => {
      // 1. Get the profile ID from clerk_user_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found for this user');
      }

      // 2. Delete existing role first (to avoid unique constraint issues)
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', profile.id);

      // 3. Insert new role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: role as any,
        });

      if (roleError) {
        throw roleError;
      }

      // TODO: Replace with Supabase role lookup in next phase

      return { clerkUserId, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to update role:', error);
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}
