import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type FuelSourceType = 'retail' | 'yard_tank' | 'mobile_service';

export interface UnifiedFuelConsumption {
  reference_id: string;
  source_type: FuelSourceType;
  source_name: string;
  vehicle_id: string | null;
  driver_id: string | null;
  fuel_date: string;
  gallons: number;
  cost: number;
  cost_per_gallon: number;
  odometer_reading: number | null;
  fuel_type: string | null;
  notes: string | null;
  vendor_id: string | null;
  tank_id: string | null;
  created_at: string;
}

export interface UnifiedFuelFilters {
  sourceTypes?: FuelSourceType[];
  vehicleIds?: string[];
  driverIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export const useUnifiedFuelConsumption = (filters?: UnifiedFuelFilters) => {
  return useQuery({
    queryKey: ['unified-fuel-consumption', filters],
    queryFn: async () => {
      let query = supabase
        .from('unified_fuel_consumption')
        .select('*')
        .order('fuel_date', { ascending: false });

      // Apply source type filter
      if (filters?.sourceTypes && filters.sourceTypes.length > 0) {
        query = query.in('source_type', filters.sourceTypes);
      }

      // Apply vehicle filter
      if (filters?.vehicleIds && filters.vehicleIds.length > 0) {
        query = query.in('vehicle_id', filters.vehicleIds);
      }

      // Apply driver filter
      if (filters?.driverIds && filters.driverIds.length > 0) {
        query = query.in('driver_id', filters.driverIds);
      }

      // Apply date range filters
      if (filters?.dateFrom) {
        query = query.gte('fuel_date', filters.dateFrom.toISOString().split('T')[0]);
      }

      if (filters?.dateTo) {
        query = query.lte('fuel_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      let results = data as UnifiedFuelConsumption[];

      // Apply search term filter locally
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        results = results.filter(log =>
          log.source_name?.toLowerCase().includes(term)
        );
      }

      return results;
    },
    refetchOnWindowFocus: false
  });
};

export const useUnifiedFuelMetrics = (filters?: UnifiedFuelFilters) => {
  return useQuery({
    queryKey: ['unified-fuel-metrics', filters],
    queryFn: async () => {
      let query = supabase
        .from('unified_fuel_consumption')
        .select('gallons, cost, source_type');

      // Apply same filters as main query
      if (filters?.sourceTypes && filters.sourceTypes.length > 0) {
        query = query.in('source_type', filters.sourceTypes);
      }

      if (filters?.vehicleIds && filters.vehicleIds.length > 0) {
        query = query.in('vehicle_id', filters.vehicleIds);
      }

      if (filters?.driverIds && filters.driverIds.length > 0) {
        query = query.in('driver_id', filters.driverIds);
      }

      if (filters?.dateFrom) {
        query = query.gte('fuel_date', filters.dateFrom.toISOString().split('T')[0]);
      }

      if (filters?.dateTo) {
        query = query.lte('fuel_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          total_gallons: 0,
          total_cost: 0,
          average_cost_per_gallon: 0,
          log_count: 0,
          by_source: {
            retail: { gallons: 0, cost: 0, count: 0 },
            yard_tank: { gallons: 0, cost: 0, count: 0 },
            mobile_service: { gallons: 0, cost: 0, count: 0 }
          }
        };
      }

      const totalGallons = data.reduce((sum, log) => sum + (log.gallons || 0), 0);
      const totalCost = data.reduce((sum, log) => sum + (log.cost || 0), 0);

      // Calculate per-source metrics
      const bySource = {
        retail: { gallons: 0, cost: 0, count: 0 },
        yard_tank: { gallons: 0, cost: 0, count: 0 },
        mobile_service: { gallons: 0, cost: 0, count: 0 }
      };

      data.forEach(log => {
        const sourceType = log.source_type as FuelSourceType;
        if (bySource[sourceType]) {
          bySource[sourceType].gallons += log.gallons || 0;
          bySource[sourceType].cost += log.cost || 0;
          bySource[sourceType].count += 1;
        }
      });

      return {
        total_gallons: totalGallons,
        total_cost: totalCost,
        average_cost_per_gallon: totalGallons > 0 ? totalCost / totalGallons : 0,
        log_count: data.length,
        by_source: bySource
      };
    }
  });
};
