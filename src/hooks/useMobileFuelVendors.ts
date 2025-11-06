import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileFuelVendor } from '@/types/fuel';
import { toast } from 'sonner';
import { useOrganizationId } from './useOrganizationId';

export const useMobileFuelVendors = () => {
  const { orgId } = useOrganizationId();
  return useQuery({
    queryKey: ['mobile-fuel-vendors', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('mobile_fuel_vendors')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('vendor_name', { ascending: true });

      if (error) throw error;
      return data as MobileFuelVendor[];
    },
    enabled: !!orgId,
  });
};

export const useAddMobileFuelVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendor: Omit<MobileFuelVendor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('mobile_fuel_vendors')
        .insert(vendor)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-fuel-vendors'] });
      toast.success('Mobile fuel vendor added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add vendor: ' + error.message);
    },
  });
};

export const useUpdateMobileFuelVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MobileFuelVendor> & { id: string }) => {
      const { data, error } = await supabase
        .from('mobile_fuel_vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-fuel-vendors'] });
      toast.success('Vendor updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update vendor: ' + error.message);
    },
  });
};
