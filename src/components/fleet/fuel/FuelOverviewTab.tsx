import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Fuel, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Truck,
  Container,
  TruckIcon as MobileVendor,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

interface MetricCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  value: string;
  label: string;
  sublabel: string;
  trend?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  icon, 
  iconBgClass, 
  value, 
  label, 
  sublabel,
  trend 
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconBgClass}`}>
            {icon}
          </div>
          {trend && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {trend}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-xs text-gray-500">{sublabel}</p>
        </div>
      </CardContent>
    </Card>
  );
};

interface RecentLog {
  reference_id: string;
  fuel_date: string;
  source_type: string;
  source_name: string;
  gallons: number;
  cost: number;
  vehicle_id: string;
}

export const FuelOverviewTab: React.FC = () => {
  const navigate = useNavigate();

  // Fetch last 30 days metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['fuel-overview-metrics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('unified_fuel_consumption')
        .select('*')
        .gte('fuel_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (error) throw error;

      const totalGallons = data?.reduce((sum, log) => sum + (log.gallons || 0), 0) || 0;
      const totalCost = data?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0;
      const avgCostPerGallon = totalGallons > 0 ? totalCost / totalGallons : 0;
      const totalLogs = data?.length || 0;

      // Calculate by source
      const retailCount = data?.filter(l => l.source_type === 'retail_station').length || 0;
      const yardTankCount = data?.filter(l => l.source_type === 'yard_tank').length || 0;
      const mobileCount = data?.filter(l => l.source_type === 'mobile_service').length || 0;

      return {
        totalGallons: totalGallons.toFixed(1),
        totalCost: totalCost.toFixed(2),
        avgCostPerGallon: avgCostPerGallon.toFixed(3),
        totalLogs,
        retailCount,
        yardTankCount,
        mobileCount
      };
    }
  });

  // Fetch recent logs
  const { data: recentLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['fuel-recent-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_fuel_consumption')
        .select('*')
        .order('fuel_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as RecentLog[];
    }
  });

  // Fetch vehicle details for recent logs
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model, nickname');
      if (error) throw error;
      return data;
    }
  });

  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'retail_station':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"><Fuel className="h-3 w-3 mr-1" />Retail</Badge>;
      case 'yard_tank':
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold"><Container className="h-3 w-3 mr-1" />Yard Tank</Badge>;
      case 'mobile_service':
        return <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"><MobileVendor className="h-3 w-3 mr-1" />Mobile</Badge>;
      default:
        return <Badge variant="outline">{sourceType}</Badge>;
    }
  };

  if (metricsLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Fuel className="h-6 w-6 text-white" />}
            iconBgClass="bg-gradient-to-br from-orange-400 to-orange-600"
            value={metrics?.totalGallons || '0'}
            label="Total Gallons"
            sublabel="Last 30 days"
          />
          <MetricCard
            icon={<DollarSign className="h-6 w-6 text-white" />}
            iconBgClass="bg-gradient-to-br from-green-400 to-green-600"
            value={`$${metrics?.totalCost || '0.00'}`}
            label="Total Cost"
            sublabel="Last 30 days"
          />
          <MetricCard
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            iconBgClass="bg-gradient-to-br from-blue-400 to-blue-600"
            value={`$${metrics?.avgCostPerGallon || '0.000'}`}
            label="Avg Cost/Gallon"
            sublabel="Last 30 days"
          />
          <MetricCard
            icon={<FileText className="h-6 w-6 text-white" />}
            iconBgClass="bg-gradient-to-br from-purple-400 to-purple-600"
            value={metrics?.totalLogs.toString() || '0'}
            label="Fuel Logs"
            sublabel="Last 30 days"
          />
        </div>
      </div>

      {/* Fuel Source Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fuel Source Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center divide-x">
            <div className="flex items-center justify-between p-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <Fuel className="h-5 w-5 text-white font-bold stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.retailCount || 0}</p>
                  <p className="text-sm font-semibold text-gray-700">Retail Stations</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <Container className="h-5 w-5 text-white font-bold stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.yardTankCount || 0}</p>
                  <p className="text-sm font-semibold text-gray-700">Yard Tank</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <MobileVendor className="h-5 w-5 text-white font-bold stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.mobileCount || 0}</p>
                  <p className="text-sm font-semibold text-gray-700">Mobile Vendor</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Fuel Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : recentLogs && recentLogs.length > 0 ? (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const vehicle = vehicles?.find(v => v.id === log.vehicle_id);
                return (
                  <div key={log.reference_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border">
                        <Truck className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {vehicle?.make && vehicle?.model 
                            ? `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`
                            : vehicle?.license_plate || 'Unknown Vehicle'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.fuel_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getSourceBadge(log.source_type)}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{log.gallons.toFixed(1)} gal</p>
                        <p className="text-xs font-medium text-green-600">${log.cost.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No recent fuel logs found</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
