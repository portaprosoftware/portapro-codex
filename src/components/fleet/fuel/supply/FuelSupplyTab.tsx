import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Droplet } from 'lucide-react';
import { useFuelTankDeliveries } from '@/hooks/useFuelTankDeliveries';
import { AddTankDeliveryDialog } from '../sources/AddTankDeliveryDialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export const FuelSupplyTab: React.FC = () => {
  const [showAddDeliveryDialog, setShowAddDeliveryDialog] = useState(false);

  const { data: deliveries, isLoading: deliveriesLoading } = useFuelTankDeliveries();
  
  const { data: tanks, isLoading: tanksLoading } = useQuery({
    queryKey: ['fuel-tanks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_tanks')
        .select('*')
        .eq('is_active', true)
        .order('tank_name');
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate delivery vs consumption over the last 30 days
  const { data: analytics } = useQuery({
    queryKey: ['fuel-supply-analytics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get deliveries
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('fuel_tank_deliveries')
        .select('gallons_delivered, total_cost')
        .gte('delivery_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (deliveriesError) throw deliveriesError;

      // Get yard tank draws from unified view
      const { data: drawsData, error: drawsError } = await supabase
        .from('unified_fuel_consumption')
        .select('gallons, cost')
        .eq('source_type', 'yard_tank')
        .gte('fuel_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (drawsError) throw drawsError;

      const totalDelivered = deliveriesData?.reduce((sum, d) => sum + (d.gallons_delivered || 0), 0) || 0;
      const totalDrawn = drawsData?.reduce((sum, d) => sum + (d.gallons || 0), 0) || 0;
      const deliveryCost = deliveriesData?.reduce((sum, d) => sum + (d.total_cost || 0), 0) || 0;
      const drawCost = drawsData?.reduce((sum, d) => sum + (d.cost || 0), 0) || 0;

      return {
        totalDelivered,
        totalDrawn,
        netChange: totalDelivered - totalDrawn,
        deliveryCost,
        drawCost,
        deliveryCount: deliveriesData?.length || 0,
        drawCount: drawsData?.length || 0,
      };
    },
  });

  const getTankLevelPercentage = (currentLevel: number, capacity: number) => {
    return (currentLevel / capacity) * 100;
  };

  const getTankStatus = (currentLevel: number, reorderThreshold: number) => {
    if (currentLevel <= reorderThreshold) {
      return { label: 'Low', color: 'bg-red-500' };
    } else if (currentLevel <= reorderThreshold * 1.5) {
      return { label: 'Reorder Soon', color: 'bg-yellow-500' };
    }
    return { label: 'Normal', color: 'bg-green-500' };
  };

  if (tanksLoading || deliveriesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Delivered</p>
                <p className="text-2xl font-bold">{analytics?.totalDelivered.toFixed(0) || 0} gal</p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Consumed</p>
                <p className="text-2xl font-bold">{analytics?.totalDrawn.toFixed(0) || 0} gal</p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Change</p>
                <p className={`text-2xl font-bold ${(analytics?.netChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(analytics?.netChange || 0) >= 0 ? '+' : ''}{analytics?.netChange.toFixed(0) || 0} gal
                </p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
              <Droplet className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivery Cost</p>
                <p className="text-2xl font-bold">${analytics?.deliveryCost.toFixed(2) || '0.00'}</p>
                <p className="text-xs text-muted-foreground mt-1">{analytics?.deliveryCount || 0} deliveries</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tank Level Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tank Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tanks && tanks.length > 0 ? (
              tanks.map((tank) => {
                const percentage = getTankLevelPercentage(tank.current_level_gallons, tank.capacity_gallons);
                const status = getTankStatus(tank.current_level_gallons, tank.reorder_threshold_gallons || 0);
                
                return (
                  <div key={tank.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tank.tank_name} ({tank.tank_number})</p>
                        <p className="text-sm text-muted-foreground">
                          {tank.current_level_gallons.toFixed(0)} / {tank.capacity_gallons.toFixed(0)} gallons
                        </p>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                    <Progress value={percentage} className="h-3" />
                    {tank.current_level_gallons <= (tank.reorder_threshold_gallons || 0) && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Below reorder threshold</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-muted-foreground">No active fuel tanks found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Deliveries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Deliveries</CardTitle>
          <Button onClick={() => setShowAddDeliveryDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Delivery
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tank</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Gallons</TableHead>
                  <TableHead>Cost/Gal</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries && deliveries.length > 0 ? (
                  deliveries.slice(0, 10).map((delivery) => {
                    const tank = tanks?.find(t => t.id === delivery.tank_id);
                    return (
                      <TableRow key={delivery.id}>
                        <TableCell>{new Date(delivery.delivery_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {tank ? `${tank.tank_name} (${tank.tank_number})` : 'Unknown Tank'}
                        </TableCell>
                        <TableCell>{delivery.supplier_name}</TableCell>
                        <TableCell>{delivery.gallons_delivered.toFixed(1)}</TableCell>
                        <TableCell>${delivery.cost_per_gallon.toFixed(3)}</TableCell>
                        <TableCell className="font-semibold">${delivery.total_cost.toFixed(2)}</TableCell>
                        <TableCell>{delivery.invoice_number || 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No deliveries recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Delivery Dialog */}
      <AddTankDeliveryDialog
        open={showAddDeliveryDialog}
        onOpenChange={setShowAddDeliveryDialog}
        tankId={undefined}
      />
    </div>
  );
};
