import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCard } from '@/components/ui/dashboard-card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Fuel, DollarSign, TrendingUp, Truck, Store, Factory, TruckIcon } from 'lucide-react';
import { AddFuelLogModal } from './AddFuelLogModal';
import { ImportFuelCSVModal } from './ImportFuelCSVModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useUnifiedFuelMetrics, useUnifiedFuelConsumption } from '@/hooks/useUnifiedFuelConsumption';

interface FuelMetrics {
  total_gallons: number;
  total_cost: number;
  average_cost_per_gallon: number;
  fleet_mpg: number;
  log_count: number;
}

interface RecentFuelLog {
  id: string;
  log_date: string;
  vehicle_license: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_nickname?: string;
  driver_name: string;
  gallons_purchased: number;
  cost_per_gallon: number;
  total_cost: number;
  fuel_station: string;
  odometer_reading: number;
}

export const FuelOverviewTab: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Get last 30 days metrics
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();

  // Use unified metrics hook
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useUnifiedFuelMetrics({
    dateFrom: startDate,
    dateTo: endDate
  });

  // Get recent unified fuel consumption
  const { data: recentLogs, isLoading: logsLoading, error: logsError } = useUnifiedFuelConsumption({
    dateFrom: undefined,
    dateTo: undefined
  });

  // Fetch vehicle details for display
  const { data: vehicles, isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ['vehicles-lookup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model, nickname');
      if (error) throw error;
      return data;
    }
  });

  const { data: drivers, isLoading: driversLoading, error: driversError } = useQuery({
    queryKey: ['drivers-lookup'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      if (error) throw error;
      return data;
    }
  });

  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'retail':
        return <Badge className="bg-blue-500 text-white text-xs"><Store className="h-3 w-3 mr-1" />Retail</Badge>;
      case 'yard_tank':
        return <Badge className="bg-green-500 text-white text-xs"><Factory className="h-3 w-3 mr-1" />Tank</Badge>;
      case 'mobile_service':
        return <Badge className="bg-purple-500 text-white text-xs"><TruckIcon className="h-3 w-3 mr-1" />Mobile</Badge>;
      default:
        return <Badge variant="outline">{sourceType}</Badge>;
    }
  };

  // Memoize recent logs display to prevent unnecessary recalculations
  const recentLogsDisplay = useMemo(() => {
    if (!recentLogs || !vehicles || !drivers) return [];
    
    return recentLogs.slice(0, 5).map(log => {
      const vehicle = vehicles.find(v => v.id === log.vehicle_id);
      const driver = drivers.find(d => d.id === log.driver_id);

      return {
        id: log.reference_id,
        log_date: log.fuel_date,
        source_type: log.source_type,
        source_name: log.source_name,
        vehicle_license: vehicle?.license_plate || 'Unknown',
        vehicle_make: vehicle?.make,
        vehicle_model: vehicle?.model,
        vehicle_nickname: vehicle?.nickname,
        driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown',
        gallons_purchased: log.gallons,
        cost_per_gallon: log.cost_per_gallon,
        total_cost: log.cost,
        fuel_station: log.source_name,
        odometer_reading: log.odometer_reading || 0
      };
    });
  }, [recentLogs, vehicles, drivers]);

  // Loading only for core data (metrics + recent logs)
  const isLoading = metricsLoading || logsLoading;

  // Log status to help diagnose any stuck states
  console.info('FuelOverviewTab status', {
    metricsLoading,
    logsLoading,
    vehiclesLoading,
    driversLoading,
    metricsError,
    logsError,
    vehiclesError,
    driversError,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Gallons"
          value={metrics?.total_gallons?.toFixed(1) || '0'}
          subtitle={`Last 30 days • ${metrics?.log_count || 0} transactions`}
          icon={Fuel}
          gradientFrom="#F59E0B"
          gradientTo="#D97706"
        />
        
        <DashboardCard
          title="Total Cost"
          value={`$${metrics?.total_cost?.toFixed(2) || '0.00'}`}
          subtitle="Last 30 days"
          icon={DollarSign}
          gradientFrom="#16A34A"
          gradientTo="#15803D"
        />
        
        <DashboardCard
          title="Avg Cost/Gallon"
          value={`$${metrics?.average_cost_per_gallon?.toFixed(2) || '0.00'}`}
          subtitle="Last 30 days"
          icon={TrendingUp}
          gradientFrom="#DC2626"
          gradientTo="#B91C1C"
        />
        
        <DashboardCard
          title="Fleet MPG"
          value="0.0"
          subtitle="Coming soon"
          icon={Truck}
          gradientFrom="#2563EB"
          gradientTo="#1E40AF"
        />
      </div>

      {/* Source Breakdown */}
      {metrics && metrics.by_source && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fuel by Source (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Retail Stations</span>
                </div>
                <div className="text-2xl font-bold">{metrics.by_source.retail.gallons.toFixed(1)} gal</div>
                <div className="text-sm text-muted-foreground">
                  ${metrics.by_source.retail.cost.toFixed(2)} • {metrics.by_source.retail.count} fills
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Factory className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Yard Tanks</span>
                </div>
                <div className="text-2xl font-bold">{metrics.by_source.yard_tank.gallons.toFixed(1)} gal</div>
                <div className="text-sm text-muted-foreground">
                  ${metrics.by_source.yard_tank.cost.toFixed(2)} • {metrics.by_source.yard_tank.count} fills
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <TruckIcon className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Mobile Vendors</span>
                </div>
                <div className="text-2xl font-bold">{metrics.by_source.mobile_service.gallons.toFixed(1)} gal</div>
                <div className="text-sm text-muted-foreground">
                  ${metrics.by_source.mobile_service.cost.toFixed(2)} • {metrics.by_source.mobile_service.count} fills
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-variant text-white"
        >
          <Plus className="h-4 w-4" />
          Add Fuel Log
        </Button>
        
        <Button
          onClick={() => setShowImportModal(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </div>

      {/* Recent Fueling Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Fueling Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <LoadingSpinner />
          ) : recentLogsDisplay && recentLogsDisplay.length > 0 ? (
            <div className="space-y-4">
              {recentLogsDisplay.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSourceBadge(log.source_type)}
                      <span className="text-xs text-muted-foreground">{log.source_name}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {log.vehicle_make && log.vehicle_model 
                          ? `${log.vehicle_make} ${log.vehicle_model}${log.vehicle_nickname ? ` - ${log.vehicle_nickname}` : ''}`
                          : 'Unknown Vehicle'}
                      </div>
                      <div className="text-sm text-muted-foreground">{log.vehicle_license}</div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{log.driver_name}</span>
                      <span>{new Date(log.log_date).toLocaleDateString()}</span>
                      <span>{log.gallons_purchased?.toFixed(1)} gal</span>
                      <span>${log.cost_per_gallon?.toFixed(2)}/gal</span>
                      {log.odometer_reading > 0 && <span>{log.odometer_reading.toLocaleString()} mi</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${log.total_cost?.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No fuel logs found. Start by adding your first fuel log.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddFuelLogModal open={showAddModal} onOpenChange={setShowAddModal} />
      <ImportFuelCSVModal open={showImportModal} onOpenChange={setShowImportModal} />
    </div>
  );
};