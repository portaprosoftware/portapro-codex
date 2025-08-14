import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardCard } from '@/components/ui/dashboard-card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Fuel, DollarSign, TrendingUp, Truck } from 'lucide-react';
import { AddFuelLogModal } from './AddFuelLogModal';
import { ImportFuelCSVModal } from './ImportFuelCSVModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['fuel-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('gallons_purchased, total_cost, cost_per_gallon')
        .gte('log_date', startDate.toISOString().split('T')[0])
        .lte('log_date', endDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          total_gallons: 0,
          total_cost: 0,
          average_cost_per_gallon: 0,
          fleet_mpg: 0,
          log_count: 0
        };
      }
      
      const totalGallons = data.reduce((sum, log) => sum + (log.gallons_purchased || 0), 0);
      const totalCost = data.reduce((sum, log) => sum + (log.total_cost || 0), 0);
      
      return {
        total_gallons: totalGallons,
        total_cost: totalCost,
        average_cost_per_gallon: totalGallons > 0 ? totalCost / totalGallons : 0,
        fleet_mpg: 0, // Calculate later
        log_count: data.length
      };
    }
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['recent-fuel-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          id,
          log_date,
          gallons_purchased,
          cost_per_gallon,
          total_cost,
          fuel_station,
          odometer_reading,
          vehicles!inner(license_plate),
          profiles!inner(first_name, last_name)
        `)
        .order('log_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return data?.map(log => ({
        id: log.id,
        log_date: log.log_date,
        vehicle_license: log.vehicles?.license_plate || 'Unknown',
        driver_name: `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim() || 'Unknown',
        gallons_purchased: log.gallons_purchased || 0,
        cost_per_gallon: log.cost_per_gallon || 0,
        total_cost: log.total_cost || 0,
        fuel_station: log.fuel_station || 'Unknown',
        odometer_reading: log.odometer_reading || 0
      })) || [];
    }
  });

  if (metricsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Gallons"
          value={metrics?.total_gallons?.toFixed(1) || '0'}
          subtitle="Last 30 days"
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
          value={metrics?.fleet_mpg?.toFixed(1) || '0.0'}
          subtitle="Last 30 days"
          icon={Truck}
          gradientFrom="#2563EB"
          gradientTo="#1E40AF"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-variant text-white"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          Add Fuel Log
        </Button>
        
        <Button
          onClick={() => setShowImportModal(true)}
          variant="outline"
          className="flex items-center gap-2"
          size="lg"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </div>

      {/* Recent Fueling Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Fueling Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <LoadingSpinner />
          ) : recentLogs && recentLogs.length > 0 ? (
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{log.vehicle_license}</Badge>
                      <span className="font-medium">{log.driver_name}</span>
                      <span className="text-sm text-muted-foreground">{log.fuel_station}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{new Date(log.log_date).toLocaleDateString()}</span>
                      <span>{log.gallons_purchased} gal</span>
                      <span>${log.cost_per_gallon}/gal</span>
                      <span>{log.odometer_reading.toLocaleString()} mi</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${log.total_cost.toFixed(2)}</div>
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