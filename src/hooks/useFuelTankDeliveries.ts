import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFuelTankDeliveries = (tankId?: string) => {
  return useQuery({
    queryKey: ['fuel-tank-deliveries', tankId],
    queryFn: async () => {
      let query = supabase
        .from('fuel_tank_deliveries')
        .select('*, fuel_tanks(*)')
        .order('delivery_date', { ascending: false });

      if (tankId) {
        query = query.eq('tank_id', tankId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};

export const useAddFuelTankDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (delivery: any) => {
      const { data, error } = await supabase
        .from('fuel_tank_deliveries')
        .insert(delivery)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-tanks'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-alerts'] });
      toast.success('Tank delivery recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record delivery: ' + error.message);
    },
  });
};
