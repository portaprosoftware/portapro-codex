import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleSummaryData {
  maintenance: {
    open_work_orders: number;
    dvirs_30d: number;
    last_dvir: {
      date: string;
      status: string;
    } | null;
    next_pm_due: {
      name: string;
      due_value: number;
      trigger_type: string;
    } | null;
  };
  fuel: {
    last_fill_date: string | null;
    last_fill_gallons: number | null;
    avg_mpg_30d: number | null;
    total_spent_30d: number;
  };
  compliance: {
    spill_kit_status: 'compliant' | 'missing';
    last_kit_check: string | null;
    incidents_30d: number;
    decon_logs_30d: number;
  };
  documents: {
    total_count: number;
    expiring_soon: number;
  };
  stock: {
    todays_load: number;
  };
  assignments: {
    active_count: number;
    upcoming_jobs: number;
  };
}

async function computeFuelSummary(vehicleId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all fuel logs for this vehicle
  const { data: fuelLogs } = await supabase
    .from('unified_fuel_consumption')
    .select('fuel_date, gallons, cost, odometer_reading, created_at')
    .eq('vehicle_id', vehicleId)
    .order('fuel_date', { ascending: false });

  if (!fuelLogs || fuelLogs.length === 0) {
    return {
      last_fill_date: null,
      last_fill_gallons: null,
      avg_mpg_30d: null,
      total_spent_30d: 0,
    };
  }

  // Last fill (no date restriction)
  const lastFill = fuelLogs[0];
  const last_fill_date = lastFill.fuel_date || lastFill.created_at;
  const last_fill_gallons = lastFill.gallons || 0;

  // Filter logs from last 30 days
  const recentLogs = fuelLogs.filter(log => {
    const logDate = new Date(log.fuel_date || log.created_at);
    return logDate >= thirtyDaysAgo;
  });

  // Total spent in last 30 days
  const total_spent_30d = recentLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

  // Calculate MPG for last 30 days
  let avg_mpg_30d: number | null = null;
  if (recentLogs.length >= 2) {
    const logsWithOdometer = [...recentLogs]
      .filter(log => log.odometer_reading != null)
      .sort((a, b) => new Date(a.fuel_date || a.created_at).getTime() - new Date(b.fuel_date || b.created_at).getTime());

    let totalDistance = 0;
    let totalGallons = 0;

    for (let i = 1; i < logsWithOdometer.length; i++) {
      const prev = logsWithOdometer[i - 1];
      const curr = logsWithOdometer[i];
      const distance = (curr.odometer_reading || 0) - (prev.odometer_reading || 0);
      
      if (distance > 0) {
        totalDistance += distance;
        totalGallons += curr.gallons || 0;
      }
    }

    if (totalGallons > 0) {
      avg_mpg_30d = totalDistance / totalGallons;
    }
  }

  return {
    last_fill_date,
    last_fill_gallons,
    avg_mpg_30d,
    total_spent_30d,
  };
}

async function computeMaintenanceSummary(vehicleId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // Count open work orders
    const { count: openWorkOrders } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('asset_id', vehicleId)
      .eq('asset_type', 'vehicle')
      .in('status', ['open', 'in_progress']);

    // DVIRs - skip for now as table schema is not in types
    const dvirsCount = 0;
    const lastDvirData = null;

    // Get next PM due
    const { data: pmSchedules } = await supabase
      .from('vehicle_pm_schedules')
      .select('*, pm_templates(name)')
      .eq('vehicle_id', vehicleId)
      .eq('active', true)
      .order('next_due_date', { ascending: true, nullsFirst: false })
      .limit(1);

    let nextPmDue = null;
    if (pmSchedules && pmSchedules.length > 0) {
      const schedule = pmSchedules[0] as any;
      nextPmDue = {
        name: schedule.pm_templates?.name || 'PM Service',
        due_value: schedule.next_due_date || schedule.next_due_mileage || schedule.next_due_engine_hours,
        trigger_type: schedule.next_due_date ? 'date' 
                    : schedule.next_due_mileage ? 'mileage' 
                    : 'hours'
      };
    }

    return {
      open_work_orders: openWorkOrders || 0,
      dvirs_30d: dvirsCount,
      last_dvir: lastDvirData 
        ? { date: lastDvirData.inspection_date, status: lastDvirData.status }
        : null,
      next_pm_due: nextPmDue
    };
  } catch (error) {
    console.error('Error computing maintenance summary:', error);
    return {
      open_work_orders: 0,
      dvirs_30d: 0,
      last_dvir: null,
      next_pm_due: null
    };
  }
}

export function useVehicleSummary(vehicleId: string | null) {
  return useQuery({
    queryKey: ['vehicle-summary', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;

      try {
        const { data, error } = await supabase
          .rpc('get_vehicle_summary', { p_vehicle_id: vehicleId });

        if (error) throw error;

        const rpcData = data as unknown as VehicleSummaryData;

        // Check if fuel data is missing or empty, compute fallback
        const needsFuelFallback = !rpcData || !rpcData.fuel || !rpcData.fuel.last_fill_date;
        
        // Check if maintenance data is missing or empty (all zeros)
        const needsMaintenanceFallback = !rpcData || !rpcData.maintenance || 
          (rpcData.maintenance.open_work_orders === 0 && 
           rpcData.maintenance.dvirs_30d === 0 && 
           !rpcData.maintenance.last_dvir && 
           !rpcData.maintenance.next_pm_due);

        if (needsFuelFallback || needsMaintenanceFallback) {
          const [fuelSummary, maintenanceSummary] = await Promise.all([
            needsFuelFallback ? computeFuelSummary(vehicleId) : Promise.resolve(rpcData.fuel),
            needsMaintenanceFallback ? computeMaintenanceSummary(vehicleId) : Promise.resolve(rpcData.maintenance)
          ]);
          
          return {
            ...rpcData,
            fuel: fuelSummary,
            maintenance: maintenanceSummary,
          } as VehicleSummaryData;
        }

        return rpcData;
      } catch (error) {
        console.error('RPC failed, using fallback computation:', error);
        
        // If RPC completely fails, compute both fuel and maintenance summaries as fallback
        const [fuelSummary, maintenanceSummary] = await Promise.all([
          computeFuelSummary(vehicleId),
          computeMaintenanceSummary(vehicleId)
        ]);
        
        return {
          maintenance: maintenanceSummary,
          fuel: fuelSummary,
          compliance: {
            spill_kit_status: 'missing' as const,
            last_kit_check: null,
            incidents_30d: 0,
            decon_logs_30d: 0,
          },
          documents: {
            total_count: 0,
            expiring_soon: 0,
          },
          stock: {
            todays_load: 0,
          },
          assignments: {
            active_count: 0,
            upcoming_jobs: 0,
          },
        } as VehicleSummaryData;
      }
    },
    enabled: !!vehicleId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
