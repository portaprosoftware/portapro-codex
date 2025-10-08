import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FuelSupplier } from '@/types/fuel';
import { toast } from 'sonner';

export const useFuelSuppliers = () => {
  return useQuery({
    queryKey: ['fuel-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_suppliers')
        .select('*')
        .eq('is_active', true)
        .order('supplier_name');

      if (error) throw error;
      return data as FuelSupplier[];
    },
  });
};

export const useAddFuelSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplier: Omit<FuelSupplier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('fuel_suppliers')
        .insert(supplier)
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

  return useMutation({
    mutationFn: async ({ id, ...supplier }: Partial<FuelSupplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('fuel_suppliers')
        .update(supplier)
        .eq('id', id)
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

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fuel_suppliers')
        .update({ is_active: false })
        .eq('id', id);

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
