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
    mutationFn: async (params: { 
      service: Omit<MobileFuelService, 'id' | 'created_at' | 'updated_at' | 'cost_per_gallon' | 'mobile_fuel_vendors'>,
      vehicles?: Array<{ vehicle_id: string; gallons_dispensed: number; odometer_reading?: number; vehicle_notes?: string }>
    }) => {
      const { service, vehicles } = params;
      
      // Insert the service record
      const { data: serviceData, error: serviceError } = await supabase
        .from('mobile_fuel_services')
        .insert(service)
        .select()
        .single();

      if (serviceError) throw serviceError;

      // Insert vehicle assignments if provided
      if (vehicles && vehicles.length > 0) {
        const vehicleRecords = vehicles.map(v => ({
          service_id: serviceData.id,
          ...v
        }));

        const { error: vehiclesError } = await supabase
          .from('mobile_fuel_service_vehicles')
          .insert(vehicleRecords);

        if (vehiclesError) throw vehiclesError;
      }

      return serviceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-fuel-services'] });
      queryClient.invalidateQueries({ queryKey: ['mobile-fuel-service-vehicles'] });
      toast.success('Mobile fuel service recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record service: ' + error.message);
    },
  });
};
