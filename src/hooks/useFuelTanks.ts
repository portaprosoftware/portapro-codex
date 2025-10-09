import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FuelTank } from '@/types/fuel';
import { toast } from 'sonner';

export const useFuelTanks = () => {
  return useQuery({
    queryKey: ['fuel-tanks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_tanks')
        .select('*')
        .eq('is_active', true)
        .order('tank_number', { ascending: true });

      if (error) throw error;
      return data as FuelTank[];
    },
  });
};

export const useAddFuelTank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tank: Omit<FuelTank, 'id' | 'created_at' | 'updated_at' | 'requires_spcc'>) => {
      const { data, error } = await supabase
        .from('fuel_tanks')
        .insert(tank)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tanks'] });
      toast.success('Fuel tank added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add fuel tank: ' + error.message);
    },
  });
};

export const useUpdateFuelTank = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FuelTank> & { id: string }) => {
      const { data, error } = await supabase
        .from('fuel_tanks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tanks'] });
      toast.success('Fuel tank updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update fuel tank: ' + error.message);
    },
  });
};

export const useSPCCTanks = (thresholdGallons?: number) => {
  return useQuery({
    queryKey: ['spcc-tanks', thresholdGallons],
    queryFn: async () => {
      // Use provided threshold or fall back to default 1320
      const threshold = thresholdGallons || 1320;
      
      const { data, error } = await supabase
        .from('fuel_tanks')
        .select('*')
        .eq('is_active', true)
        .gte('capacity_gallons', threshold)
        .order('tank_number', { ascending: true });

      if (error) throw error;
      return data as FuelTank[];
    },
  });
};
