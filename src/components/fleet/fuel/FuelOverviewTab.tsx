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
    queryKey: ['fuel-metrics', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_fuel_metrics', {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        });
      
      if (error) throw error;
      return data as unknown as FuelMetrics;
    }
  });

  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['recent-fuel-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_recent_fuel_logs', { limit_count: 5 });
      
      if (error) throw error;
      return data as RecentFuelLog[];
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
          gradientFrom="from-blue-600"
          gradientTo="to-blue-800"
        />
        
        <DashboardCard
          title="Total Cost"
          value={`$${metrics?.total_cost?.toFixed(2) || '0.00'}`}
          subtitle="Last 30 days"
          icon={DollarSign}
          gradientFrom="from-green-600"
          gradientTo="to-green-800"
        />
        
        <DashboardCard
          title="Avg Cost/Gallon"
          value={`$${metrics?.average_cost_per_gallon?.toFixed(2) || '0.00'}`}
          subtitle="Last 30 days"
          icon={TrendingUp}
          gradientFrom="from-purple-600"
          gradientTo="to-purple-800"
        />
        
        <DashboardCard
          title="Fleet MPG"
          value={metrics?.fleet_mpg?.toFixed(1) || '0.0'}
          subtitle="Last 30 days"
          icon={Truck}
          gradientFrom="from-orange-600"
          gradientTo="to-orange-800"
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