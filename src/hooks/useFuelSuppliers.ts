import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FuelSupplier } from '@/types/fuel';
import { toast } from 'sonner';
import { useOrganizationId } from './useOrganizationId';

export const useFuelSuppliers = () => {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['fuel-suppliers', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await (supabase as any)
        .from('fuel_suppliers')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('supplier_name');

      if (error) throw error;
      return data as FuelSupplier[];
    },
    enabled: !!orgId,
  });
};

export const useAddFuelSupplier = () => {
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  return useMutation({
    mutationFn: async (supplier: Omit<FuelSupplier, 'id' | 'created_at' | 'updated_at'>) => {
      if (!orgId) throw new Error('Organization required');

      const { data, error } = await supabase
        .from('fuel_suppliers')
        .insert({ ...supplier, organization_id: orgId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-suppliers'] });
      toast.success('Supplier added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add supplier: ' + error.message);
    },
  });
};

export const useUpdateFuelSupplier = () => {
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  return useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<FuelSupplier> & { id: string }) => {
      if (!orgId) throw new Error('Organization required');

      const { data, error } = await (supabase as any)
        .from('fuel_suppliers')
        .update(supplier)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-suppliers'] });
      toast.success('Supplier updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update supplier: ' + error.message);
    },
  });
};

export const useDeleteFuelSupplier = () => {
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error('Organization required');

      const { error } = await (supabase as any)
        .from('fuel_suppliers')
        .update({ is_active: false })
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-suppliers'] });
      toast.success('Supplier deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete supplier: ' + error.message);
    },
  });
};
