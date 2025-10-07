import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileFuelService } from '@/types/fuel';
import { toast } from 'sonner';

export const useMobileFuelServices = (vendorId?: string) => {
  return useQuery({
    queryKey: ['mobile-fuel-services', vendorId],
    queryFn: async () => {
      let query = supabase
        .from('mobile_fuel_services')
        .select('*, mobile_fuel_vendors(*)')
        .order('service_date', { ascending: false });

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MobileFuelService[];
    },
  });
};

export const useAddMobileFuelService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Omit<MobileFuelService, 'id' | 'created_at' | 'updated_at' | 'cost_per_gallon' | 'mobile_fuel_vendors'>) => {
      const { data, error } = await supabase
        .from('mobile_fuel_services')
        .insert(service)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-fuel-services'] });
      toast.success('Mobile fuel service recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record service: ' + error.message);
    },
  });
};
