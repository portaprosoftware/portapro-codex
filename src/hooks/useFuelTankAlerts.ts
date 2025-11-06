import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FuelTankAlert } from '@/types/fuel';
import { toast } from 'sonner';
import { useOrganizationId } from './useOrganizationId';

export const useFuelTankAlerts = (tankId?: string) => {
  const { orgId } = useOrganizationId();
  return useQuery({
    queryKey: ['fuel-tank-alerts', orgId, tankId],
    queryFn: async () => {
      if (!orgId) return [];

      let query = supabase
        .from('fuel_tank_inventory_alerts')
        .select('*')
        .eq('organization_id', orgId)
        .eq('acknowledged', false)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (tankId) {
        query = query.eq('tank_id', tankId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FuelTankAlert[];
    },
    enabled: !!orgId,
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('fuel_tank_inventory_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-alerts'] });
      toast.success('Alert acknowledged');
    },
    onError: (error) => {
      toast.error('Failed to acknowledge alert: ' + error.message);
    },
  });
};

export const useUnacknowledgedAlertsCount = () => {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['fuel-tank-alerts-count', orgId],
    queryFn: async () => {
      if (!orgId) return 0;

      const { count, error } = await supabase
        .from('fuel_tank_inventory_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('acknowledged', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!orgId,
  });
};
