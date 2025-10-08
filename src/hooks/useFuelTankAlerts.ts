import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FuelTankAlert } from '@/types/fuel';
import { toast } from 'sonner';

export const useFuelTankAlerts = (tankId?: string) => {
  return useQuery({
    queryKey: ['fuel-tank-alerts', tankId],
    queryFn: async () => {
      let query = supabase
        .from('fuel_tank_inventory_alerts')
        .select('*')
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
  return useQuery({
    queryKey: ['fuel-tank-alerts-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fuel_tank_inventory_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('acknowledged', false);

      if (error) throw error;
      return count || 0;
    },
  });
};
