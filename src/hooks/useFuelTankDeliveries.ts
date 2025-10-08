import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FuelTankDelivery {
  id: string;
  tank_id: string;
  delivery_date: string;
  delivery_time?: string;
  supplier_name: string;
  gallons_delivered: number;
  cost_per_gallon: number;
  total_cost: number;
  invoice_number?: string | null;
  driver_name?: string | null;
  notes?: string | null;
  created_at: string;
  bol_ticket_number?: string;
  truck_number?: string;
  fuel_grade?: string;
  winter_blend?: boolean;
  additive_notes?: string;
  gross_gallons?: number;
  temperature_corrected_gallons?: number;
  price_per_gallon_pretax?: number;
  excise_tax?: number;
  delivery_fee?: number;
  hazmat_fee?: number;
  other_fees?: any;
  payment_method?: string;
  payment_terms?: string;
  pre_delivery_stick_reading?: number;
  post_delivery_stick_reading?: number;
  water_bottom_test_result?: string;
  water_bottom_inches?: number;
  calculated_variance?: number;
  variance_tolerance?: number;
  variance_flag?: boolean;
  ticket_photo_urls?: string[];
  dip_chart_url?: string;
  after_hours_delivery?: boolean;
  partial_fill_blocked?: boolean;
  blocked_reason?: string;
  entered_by?: string;
  verified_by?: string;
  verified_at?: string;
  locked_to_ledger?: boolean;
  locked_at?: string;
  locked_by?: string;
}

export const useFuelTankDeliveries = (tankId?: string) => {
  return useQuery({
    queryKey: ['fuel-tank-deliveries', tankId],
    queryFn: async () => {
      let query = supabase
        .from('fuel_tank_deliveries')
        .select('*')
        .order('delivery_date', { ascending: false });

      if (tankId) {
        query = query.eq('tank_id', tankId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FuelTankDelivery[];
    },
  });
};

export const useAddFuelTankDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (delivery: Partial<Omit<FuelTankDelivery, 'id' | 'created_at'>>) => {
      const { data, error } = await supabase
        .from('fuel_tank_deliveries')
        .insert(delivery as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-tanks'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-tank-level-history'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-supply-analytics'] });
      toast.success('Fuel delivery recorded successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to record fuel delivery: ' + error.message);
    },
  });
};

export const useFuelTankLevelHistory = (tankId?: string) => {
  return useQuery({
    queryKey: ['fuel-tank-level-history', tankId],
    queryFn: async () => {
      let query = supabase
        .from('fuel_tank_level_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (tankId) {
        query = query.eq('tank_id', tankId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};
