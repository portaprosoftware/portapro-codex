import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from '@/hooks/useOrganizationId';
import { useToast } from '@/hooks/use-toast';

export interface FleetVehicle {
  id: string;
  license_plate: string;
  vehicle_name?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  status?: string;
  mileage?: number;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

export function useFleetVehicles(filters?: { status?: string }) {
  const { orgId } = useOrganizationId();

  return useQuery<FleetVehicle[]>({
    queryKey: ['fleet-vehicles', orgId, filters],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('organization_id', orgId)
        .order('license_plate');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useFleetVehicle(vehicleId: string | null) {
  const { orgId } = useOrganizationId();

  return useQuery<FleetVehicle | null>({
    queryKey: ['fleet-vehicle', vehicleId, orgId],
    queryFn: async () => {
      if (!vehicleId || !orgId) return null;

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('organization_id', orgId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId && !!orgId,
  });
}

export function useCreateFleetVehicle() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (vehicleData: Omit<FleetVehicle, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          ...vehicleData,
          organization_id: orgId,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles', orgId] });
      toast({
        title: 'Success',
        description: 'Vehicle created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create vehicle: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateFleetVehicle() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...vehicleData }: Partial<FleetVehicle> & { id: string }) => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles', orgId] });
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicle', data.id, orgId] });
      toast({
        title: 'Success',
        description: 'Vehicle updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update vehicle: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteFleetVehicle() {
  const { orgId } = useOrganizationId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (vehicleId: string) => {
      if (!orgId) throw new Error('Organization ID required');

      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)
        .eq('organization_id', orgId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleet-vehicles', orgId] });
      toast({
        title: 'Success',
        description: 'Vehicle deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete vehicle: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
