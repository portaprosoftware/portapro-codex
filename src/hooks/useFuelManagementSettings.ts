import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FuelManagementSettings {
  id: string;
  retail_enabled: boolean;
  yard_tank_enabled: boolean;
  mobile_service_enabled: boolean;
  default_fuel_source: 'retail' | 'yard_tank' | 'mobile_service';
  tank_low_threshold_percent: number;
  tank_critical_threshold_percent: number;
  unusual_consumption_threshold_percent: number;
  price_spike_threshold_percent: number;
  auto_calculate_mpg: boolean;
  auto_calculate_cost_per_mile: boolean;
  auto_flag_high_consumption: boolean;
  auto_flag_price_spikes: boolean;
  auto_update_tank_levels: boolean;
  variance_tolerance_percent: number;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  notification_email: string | null;
  notification_phone: string | null;
  notification_frequency: 'immediate' | 'daily' | 'weekly';
  spcc_compliance_enabled: boolean;
  spcc_tank_threshold_gallons: number;
  created_at: string;
  updated_at: string;
}

export const useFuelManagementSettings = () => {
  return useQuery({
    queryKey: ['fuel-management-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_management_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: insertError } = await supabase
            .from('fuel_management_settings')
            .insert({})
            .select()
            .single();
          
          if (insertError) throw insertError;
          return newSettings as FuelManagementSettings;
        }
        throw error;
      }

      return data as FuelManagementSettings;
    }
  });
};

export const useUpdateFuelManagementSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<FuelManagementSettings>) => {
      // Get the current settings to find the ID
      const { data: currentSettings } = await supabase
        .from('fuel_management_settings')
        .select('id')
        .limit(1)
        .single();

      if (!currentSettings) {
        throw new Error('Settings not found');
      }

      const { data, error } = await supabase
        .from('fuel_management_settings')
        .update(updates)
        .eq('id', currentSettings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-management-settings'] });
      toast({
        title: "✅ Settings Updated",
        description: "Fuel management settings have been saved successfully.",
        duration: 2000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};
