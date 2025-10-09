import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, TrendingUp, DollarSign, Droplet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFuelManagementSettings } from '@/hooks/useFuelManagementSettings';

export const ComplianceAlerts: React.FC = () => {
  const { data: fuelSettings } = useFuelManagementSettings();
  const { data: tankAlerts } = useQuery({
    queryKey: ['tank-refill-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_tanks')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const criticalThreshold = (fuelSettings?.tank_critical_threshold_percent || 10) / 100;
      const lowThreshold = (fuelSettings?.tank_low_threshold_percent || 25) / 100;
      
      return data?.filter(tank => {
        const currentLevel = tank.current_level_gallons || 0;
        const reorderPoint = tank.reorder_threshold_gallons || 0;
        return currentLevel <= reorderPoint;
      }).map(tank => ({
        ...tank,
        severity: (tank.current_level_gallons || 0) <= (tank.reorder_threshold_gallons || 0) * criticalThreshold
          ? 'critical' 
          : 'warning'
      }));
    },
    refetchInterval: 60000 // Check every minute
  });

  const { data: spccCompliance } = useQuery({
    queryKey: ['spcc-compliance', fuelSettings?.spcc_tank_threshold_gallons],
    queryFn: async () => {
      if (!fuelSettings?.spcc_compliance_enabled) return [];
      
      const threshold = fuelSettings?.spcc_tank_threshold_gallons || 1320;
      
      const { data, error } = await supabase
        .from('fuel_tanks')
        .select('*')
        .eq('is_active', true)
        .gte('capacity_gallons', threshold);

      if (error) throw error;

      return data?.map(tank => ({
        ...tank,
        requires_spcc: true,
        compliance_status: tank.capacity_gallons >= threshold ? 'active' : 'not_required'
      }));
    },
    enabled: !!fuelSettings
  });

  const { data: unusualConsumption } = useQuery({
    queryKey: ['unusual-consumption-alerts', fuelSettings?.unusual_consumption_threshold_percent],
    queryFn: async () => {
      if (!fuelSettings?.auto_flag_high_consumption) return [];
      
      const threshold = (fuelSettings?.unusual_consumption_threshold_percent || 150) / 100;
      
      // Get consumption data for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('unified_fuel_consumption')
        .select('vehicle_id, gallons, fuel_date, cost')
        .gte('fuel_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (error) throw error;

      // Group by vehicle and calculate averages
      const vehicleConsumption = new Map<string, { gallons: number[], costs: number[] }>();
      
      data?.forEach(log => {
        if (!log.vehicle_id) return;
        if (!vehicleConsumption.has(log.vehicle_id)) {
          vehicleConsumption.set(log.vehicle_id, { gallons: [], costs: [] });
        }
        vehicleConsumption.get(log.vehicle_id)!.gallons.push(log.gallons || 0);
        vehicleConsumption.get(log.vehicle_id)!.costs.push(log.cost || 0);
      });

      const alerts: any[] = [];

      vehicleConsumption.forEach((consumption, vehicleId) => {
        const avgGallons = consumption.gallons.reduce((a, b) => a + b, 0) / consumption.gallons.length;
        const maxGallons = Math.max(...consumption.gallons);
        
        // Flag if any single transaction exceeds threshold
        if (maxGallons > avgGallons * threshold) {
          alerts.push({
            vehicle_id: vehicleId,
            type: 'high_consumption',
            max_gallons: maxGallons,
            avg_gallons: avgGallons,
            variance_percent: ((maxGallons - avgGallons) / avgGallons * 100).toFixed(1)
          });
        }
      });

      return alerts;
    },
    enabled: !!fuelSettings
  });

  const { data: priceSpikes } = useQuery({
    queryKey: ['price-spike-alerts', fuelSettings?.price_spike_threshold_percent],
    queryFn: async () => {
      if (!fuelSettings?.auto_flag_price_spikes) return [];
      
      const threshold = 1 + ((fuelSettings?.price_spike_threshold_percent || 15) / 100);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('unified_fuel_consumption')
        .select('cost_per_gallon, fuel_date, source_name, source_type')
        .gte('fuel_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('fuel_date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      const avgPrice = data.reduce((sum, log) => sum + (log.cost_per_gallon || 0), 0) / data.length;
      
      return data
        .filter(log => (log.cost_per_gallon || 0) > avgPrice * threshold)
        .map(log => ({
          ...log,
          avg_price: avgPrice,
          variance_percent: (((log.cost_per_gallon || 0) - avgPrice) / avgPrice * 100).toFixed(1)
        }));
    },
    enabled: !!fuelSettings
  });

  return (
    <div className="space-y-4">
      {/* Tank Refill Alerts */}
      {tankAlerts && tankAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-orange-500" />
              Tank Refill Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tankAlerts.map(tank => (
              <Alert key={tank.id} variant={tank.severity === 'critical' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold">
                  {tank.tank_name}
                  <Badge variant={tank.severity === 'critical' ? 'destructive' : 'secondary'} className="ml-2">
                    {tank.severity === 'critical' ? 'CRITICAL' : 'Low'}
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  Current level: {tank.current_level_gallons?.toFixed(0)} gal / {tank.capacity_gallons} gal capacity
                  <br />
                  Reorder threshold: {tank.reorder_threshold_gallons} gal
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SPCC Compliance */}
      {spccCompliance && spccCompliance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              SPCC Compliance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-3">
              Tanks over {fuelSettings?.spcc_tank_threshold_gallons?.toLocaleString() || '1,320'} gallons require SPCC compliance
            </div>
            <div className="space-y-2">
              {spccCompliance.map(tank => (
                <div key={tank.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{tank.tank_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Capacity: {tank.capacity_gallons} gallons
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    SPCC Required
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unusual Consumption Alerts */}
      {unusualConsumption && unusualConsumption.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              Unusual Consumption Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unusualConsumption.slice(0, 5).map((alert, idx) => (
              <Alert key={idx}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Vehicle {alert.vehicle_id}</AlertTitle>
                <AlertDescription>
                  High consumption detected: {alert.max_gallons.toFixed(1)} gal
                  <br />
                  Average: {alert.avg_gallons.toFixed(1)} gal
                  <br />
                  <span className="font-semibold text-yellow-600">
                    +{alert.variance_percent}% above average
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Price Spike Alerts */}
      {priceSpikes && priceSpikes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-500" />
              Price Spike Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priceSpikes.slice(0, 5).map((spike, idx) => (
              <Alert key={idx} variant="default">
                <DollarSign className="h-4 w-4" />
                <AlertTitle>{spike.source_name}</AlertTitle>
                <AlertDescription>
                  ${spike.cost_per_gallon?.toFixed(3)}/gal on {spike.fuel_date}
                  <br />
                  Average: ${spike.avg_price.toFixed(3)}/gal
                  <br />
                  <span className="font-semibold text-red-600">
                    +{spike.variance_percent}% above average
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Alerts */}
      {(!tankAlerts?.length && !spccCompliance?.length && !unusualConsumption?.length && !priceSpikes?.length) && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No compliance alerts at this time
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
