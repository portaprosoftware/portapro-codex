import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from './useOrganizationId';

export interface SystemUser {
  id: string;
  name: string;
  email?: string;
}

export function useSystemUsers() {
  const { orgId } = useOrganizationId();

  return useQuery<SystemUser[]>({
    queryKey: ['system-users', orgId],
    queryFn: async () => {
      if (!orgId) {
        console.warn('No organization ID - cannot fetch system users');
        return [];
      }

      // Fetch all users with their roles from profiles and user_roles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, user_roles!inner(role)')
        .eq('organization_id', orgId)
        .order('first_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching system users:', error);
        return [];
      }
      
      // Transform the data into SystemUser format
      const users: SystemUser[] = (data || []).map((user: any) => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User',
        email: user.email,
      }));
      
      return users;
    },
    enabled: !!orgId,
  });
}
