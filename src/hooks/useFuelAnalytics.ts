import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedFuelFilters } from './useUnifiedFuelConsumption';

export interface VendorPerformance {
  vendor_name: string;
  total_gallons: number;
  total_cost: number;
  avg_cost_per_gallon: number;
  transaction_count: number;
  last_purchase_date: string;
}

export interface CostPerMileMetrics {
  total_fuel_cost: number;
  total_miles_driven: number;
  cost_per_mile: number;
  by_vehicle: Array<{
    vehicle_id: string;
    license_plate: string;
    fuel_cost: number;
    miles_driven: number;
    cost_per_mile: number;
  }>;
}

export interface FleetMPGMetrics {
  fleet_avg_mpg: number;
  total_gallons: number;
  total_miles: number;
  by_vehicle: Array<{
    vehicle_id: string;
    license_plate: string;
    gallons: number;
    miles: number;
    mpg: number;
  }>;
}

export interface SourceComparison {
  source_type: string;
  total_gallons: number;
  total_cost: number;
  avg_cost_per_gallon: number;
  transaction_count: number;
}

export const useVendorPerformance = (filters?: UnifiedFuelFilters) => {
  return useQuery({
    queryKey: ['vendor-performance', filters],
    queryFn: async () => {
      let query = supabase
        .from('unified_fuel_consumption')
        .select('source_name, gallons, cost, cost_per_gallon, fuel_date, source_type');

      if (filters?.dateFrom) {
        query = query.gte('fuel_date', filters.dateFrom.toISOString().split('T')[0]);
      }
      if (filters?.dateTo) {
        query = query.lte('fuel_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by vendor/source
      const vendorMap = new Map<string, VendorPerformance>();
      
      data?.forEach(log => {
        const key = log.source_name;
        if (!vendorMap.has(key)) {
          vendorMap.set(key, {
            vendor_name: key,
            total_gallons: 0,
            total_cost: 0,
            avg_cost_per_gallon: 0,
            transaction_count: 0,
            last_purchase_date: log.fuel_date
          });
        }
        
        const vendor = vendorMap.get(key)!;
        vendor.total_gallons += log.gallons || 0;
        vendor.total_cost += log.cost || 0;
        vendor.transaction_count += 1;
        if (log.fuel_date > vendor.last_purchase_date) {
          vendor.last_purchase_date = log.fuel_date;
        }
      });

      // Calculate averages
      const vendors = Array.from(vendorMap.values()).map(v => ({
        ...v,
        avg_cost_per_gallon: v.total_gallons > 0 ? v.total_cost / v.total_gallons : 0
      }));

      return vendors.sort((a, b) => b.total_cost - a.total_cost);
    }
  });
};

export const useCostPerMile = (filters?: UnifiedFuelFilters) => {
  return useQuery({
    queryKey: ['cost-per-mile', filters],
    queryFn: async () => {
      // Get fuel data
      let fuelQuery = supabase
        .from('unified_fuel_consumption')
        .select('vehicle_id, cost, fuel_date');

      if (filters?.dateFrom) {
        fuelQuery = fuelQuery.gte('fuel_date', filters.dateFrom.toISOString().split('T')[0]);
      }
      if (filters?.dateTo) {
        fuelQuery = fuelQuery.lte('fuel_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data: fuelData, error: fuelError } = await fuelQuery;
      if (fuelError) throw fuelError;

      // Get odometer data from fuel_logs to calculate miles
      let odometerQuery = supabase
        .from('fuel_logs')
        .select('vehicle_id, odometer_reading, log_date')
        .not('odometer_reading', 'is', null)
        .order('log_date', { ascending: true });

      if (filters?.dateFrom) {
        odometerQuery = odometerQuery.gte('log_date', filters.dateFrom.toISOString().split('T')[0]);
      }
      if (filters?.dateTo) {
        odometerQuery = odometerQuery.lte('log_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data: odometerData, error: odometerError } = await odometerQuery;
      if (odometerError) throw odometerError;

      // Get vehicle info
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, license_plate');

      const vehicleMap = new Map(vehicles?.map(v => [v.id, v.license_plate]) || []);

      // Calculate miles per vehicle
      const vehicleMiles = new Map<string, number>();
      const vehicleGroups = new Map<string, typeof odometerData>();
      
      odometerData?.forEach(reading => {
        if (!reading.vehicle_id) return;
        if (!vehicleGroups.has(reading.vehicle_id)) {
          vehicleGroups.set(reading.vehicle_id, []);
        }
        vehicleGroups.get(reading.vehicle_id)!.push(reading);
      });

      vehicleGroups.forEach((readings, vehicleId) => {
        if (readings.length < 2) return;
        const sorted = readings.sort((a, b) => 
          new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
        );
        const miles = sorted[sorted.length - 1].odometer_reading! - sorted[0].odometer_reading!;
        if (miles > 0) {
          vehicleMiles.set(vehicleId, miles);
        }
      });

      // Calculate costs per vehicle
      const vehicleCosts = new Map<string, number>();
      fuelData?.forEach(log => {
        if (!log.vehicle_id) return;
        vehicleCosts.set(
          log.vehicle_id,
          (vehicleCosts.get(log.vehicle_id) || 0) + (log.cost || 0)
        );
      });

      const byVehicle = Array.from(vehicleCosts.entries())
        .map(([vehicleId, cost]) => ({
          vehicle_id: vehicleId,
          license_plate: vehicleMap.get(vehicleId) || 'Unknown',
          fuel_cost: cost,
          miles_driven: vehicleMiles.get(vehicleId) || 0,
          cost_per_mile: (vehicleMiles.get(vehicleId) || 0) > 0 
            ? cost / vehicleMiles.get(vehicleId)! 
            : 0
        }))
        .filter(v => v.miles_driven > 0)
        .sort((a, b) => b.cost_per_mile - a.cost_per_mile);

      const totalCost = byVehicle.reduce((sum, v) => sum + v.fuel_cost, 0);
      const totalMiles = byVehicle.reduce((sum, v) => sum + v.miles_driven, 0);

      return {
        total_fuel_cost: totalCost,
        total_miles_driven: totalMiles,
        cost_per_mile: totalMiles > 0 ? totalCost / totalMiles : 0,
        by_vehicle: byVehicle
      };
    }
  });
};

export const useFleetMPG = (filters?: UnifiedFuelFilters) => {
  return useQuery({
    queryKey: ['fleet-mpg', filters],
    queryFn: async () => {
      // Get fuel consumption data
      let fuelQuery = supabase
        .from('unified_fuel_consumption')
        .select('vehicle_id, gallons, fuel_date');

      if (filters?.dateFrom) {
        fuelQuery = fuelQuery.gte('fuel_date', filters.dateFrom.toISOString().split('T')[0]);
      }
      if (filters?.dateTo) {
        fuelQuery = fuelQuery.lte('fuel_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data: fuelData, error: fuelError } = await fuelQuery;
      if (fuelError) throw fuelError;

      // Get odometer readings
      let odometerQuery = supabase
        .from('fuel_logs')
        .select('vehicle_id, odometer_reading, log_date')
        .not('odometer_reading', 'is', null)
        .order('log_date', { ascending: true });

      if (filters?.dateFrom) {
        odometerQuery = odometerQuery.gte('log_date', filters.dateFrom.toISOString().split('T')[0]);
      }
      if (filters?.dateTo) {
        odometerQuery = odometerQuery.lte('log_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data: odometerData, error: odometerError } = await odometerQuery;
      if (odometerError) throw odometerError;

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, license_plate');

      const vehicleMap = new Map(vehicles?.map(v => [v.id, v.license_plate]) || []);

      // Calculate miles per vehicle
      const vehicleMiles = new Map<string, number>();
      const vehicleGroups = new Map<string, typeof odometerData>();
      
      odometerData?.forEach(reading => {
        if (!reading.vehicle_id) return;
        if (!vehicleGroups.has(reading.vehicle_id)) {
          vehicleGroups.set(reading.vehicle_id, []);
        }
        vehicleGroups.get(reading.vehicle_id)!.push(reading);
      });

      vehicleGroups.forEach((readings, vehicleId) => {
        if (readings.length < 2) return;
        const sorted = readings.sort((a, b) => 
          new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
        );
        const miles = sorted[sorted.length - 1].odometer_reading! - sorted[0].odometer_reading!;
        if (miles > 0) {
          vehicleMiles.set(vehicleId, miles);
        }
      });

      // Calculate gallons per vehicle
      const vehicleGallons = new Map<string, number>();
      fuelData?.forEach(log => {
        if (!log.vehicle_id) return;
        vehicleGallons.set(
          log.vehicle_id,
          (vehicleGallons.get(log.vehicle_id) || 0) + (log.gallons || 0)
        );
      });

      const byVehicle = Array.from(vehicleGallons.entries())
        .map(([vehicleId, gallons]) => ({
          vehicle_id: vehicleId,
          license_plate: vehicleMap.get(vehicleId) || 'Unknown',
          gallons,
          miles: vehicleMiles.get(vehicleId) || 0,
          mpg: (vehicleMiles.get(vehicleId) || 0) > 0 && gallons > 0
            ? vehicleMiles.get(vehicleId)! / gallons
            : 0
        }))
        .filter(v => v.miles > 0 && v.mpg > 0)
        .sort((a, b) => b.mpg - a.mpg);

      const totalGallons = byVehicle.reduce((sum, v) => sum + v.gallons, 0);
      const totalMiles = byVehicle.reduce((sum, v) => sum + v.miles, 0);

      return {
        fleet_avg_mpg: totalGallons > 0 ? totalMiles / totalGallons : 0,
        total_gallons: totalGallons,
        total_miles: totalMiles,
        by_vehicle: byVehicle
      };
    }
  });
};

export const useSourceComparison = (filters?: UnifiedFuelFilters) => {
  return useQuery({
    queryKey: ['source-comparison', filters],
    queryFn: async () => {
      let query = supabase
        .from('unified_fuel_consumption')
        .select('source_type, gallons, cost, cost_per_gallon');

      if (filters?.dateFrom) {
        query = query.gte('fuel_date', filters.dateFrom.toISOString().split('T')[0]);
      }
      if (filters?.dateTo) {
        query = query.lte('fuel_date', filters.dateTo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;

      const sourceMap = new Map<string, SourceComparison>();

      data?.forEach(log => {
        const key = log.source_type;
        if (!sourceMap.has(key)) {
          sourceMap.set(key, {
            source_type: key,
            total_gallons: 0,
            total_cost: 0,
            avg_cost_per_gallon: 0,
            transaction_count: 0
          });
        }

        const source = sourceMap.get(key)!;
        source.total_gallons += log.gallons || 0;
        source.total_cost += log.cost || 0;
        source.transaction_count += 1;
      });

      return Array.from(sourceMap.values()).map(s => ({
        ...s,
        avg_cost_per_gallon: s.total_gallons > 0 ? s.total_cost / s.total_gallons : 0
      }));
    }
  });
};
