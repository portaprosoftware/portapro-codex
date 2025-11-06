import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FuelTank } from '@/types/fuel';
import { toast } from 'sonner';
import { useOrganizationId } from './useOrganizationId';

export const useFuelTanks = () => {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['fuel-tanks', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await (supabase as any)
        .from('fuel_tanks')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('tank_number', { ascending: true });

      if (error) throw error;
      return data as FuelTank[];
    },
    enabled: !!orgId,
  });
};

export const useAddFuelTank = () => {
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  return useMutation({
    mutationFn: async (tank: Omit<FuelTank, 'id' | 'created_at' | 'updated_at' | 'requires_spcc'>) => {
      if (!orgId) throw new Error('Organization required');

      const { data, error } = await supabase
        .from('fuel_tanks')
        .insert({ ...tank, organization_id: orgId })
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
  const { orgId } = useOrganizationId();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FuelTank> & { id: string }) => {
      if (!orgId) throw new Error('Organization required');

      const { data, error } = await (supabase as any)
        .from('fuel_tanks')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', orgId)
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
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['spcc-tanks', thresholdGallons, orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Use provided threshold or fall back to default 1320
      const threshold = thresholdGallons || 1320;
      
      const { data, error } = await (supabase as any)
        .from('fuel_tanks')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .gte('capacity_gallons', threshold)
        .order('tank_number', { ascending: true });

      if (error) throw error;
      return data as FuelTank[];
    },
    enabled: !!orgId,
  });
};
