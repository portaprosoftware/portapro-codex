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
