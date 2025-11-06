import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileFuelService } from '@/types/fuel';
import { toast } from 'sonner';
import { useOrganizationId } from './useOrganizationId';

export const useMobileFuelServices = (vendorId?: string) => {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ['mobile-fuel-services', vendorId, orgId],
    queryFn: async () => {
      if (!orgId) return [];

      let query = (supabase as any)
        .from('mobile_fuel_services')
        .select('*, mobile_fuel_vendors(*)')
        .eq('organization_id', orgId)
        .order('service_date', { ascending: false });

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MobileFuelService[];
    },
    enabled: !!orgId,
  });
};

export const useAddMobileFuelService = () => {
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  return useMutation({
    mutationFn: async (params: { 
      service: any,
      vehicles?: Array<{ vehicle_id: string; gallons_dispensed: number; odometer_reading?: number; vehicle_notes?: string }>
    }) => {
      if (!orgId) throw new Error('Organization required');

      const { service, vehicles } = params;
      
      // Insert the service record with organization_id
      const { data: serviceData, error: serviceError } = await supabase
        .from('mobile_fuel_services')
        .insert([{ ...service, organization_id: orgId } as any])
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
