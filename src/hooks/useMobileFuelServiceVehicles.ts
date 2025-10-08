import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileFuelServiceVehicle } from '@/types/fuel';
import { toast } from 'sonner';

export const useMobileFuelServiceVehicles = (serviceId?: string) => {
  return useQuery({
    queryKey: ['mobile-fuel-service-vehicles', serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      
      const { data, error } = await supabase
        .from('mobile_fuel_service_vehicles')
        .select('*, vehicles(*)')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MobileFuelServiceVehicle[];
    },
    enabled: !!serviceId,
  });
};

export const useAddMobileFuelServiceVehicles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicles: Omit<MobileFuelServiceVehicle, 'id' | 'created_at' | 'updated_at'>[]) => {
      const { data, error } = await supabase
        .from('mobile_fuel_service_vehicles')
        .insert(vehicles)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-fuel-service-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-fuel-services'] });
    },
    onError: (error) => {
      toast.error('Failed to add vehicle assignments: ' + error.message);
    },
  });
};
