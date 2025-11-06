import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { useOnlineStatus } from './useOnlineStatus';
import { useOrganizationId } from './useOrganizationId';
import { 
  getAllCachedWorkOrders, 
  cacheWorkOrder,
  initDB 
} from '@/utils/indexedDB';

export function useTechnicianWorkOrders() {
  const { user } = useUser();
  const { isOnline } = useOnlineStatus();
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['technician-work-orders', orgId, user?.id],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization required');
      // Initialize IndexedDB
      await initDB();

      // Try to fetch from Supabase if online
      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('work_orders')
            .select('*')
            .eq('organization_id', orgId)
            .eq('assigned_to', user?.id)
            .in('status', ['open', 'in_progress', 'awaiting_parts', 'on_hold'])
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true });

          if (error) throw error;

          // Cache each work order
          if (data) {
            for (const workOrder of data) {
              await cacheWorkOrder(workOrder.id, workOrder);
            }
          }

          return data || [];
        } catch (error) {
          console.error('Failed to fetch work orders, using cache:', error);
          // Fall back to cache if online fetch fails
          return await getAllCachedWorkOrders();
        }
      }

      // Use cached data when offline
      return await getAllCachedWorkOrders();
    },
    enabled: !!orgId && !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: isOnline,
    refetchOnReconnect: true,
  });
}
