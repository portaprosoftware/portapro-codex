import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Container, AlertTriangle, CheckCircle, Calendar, Truck } from 'lucide-react';
import { useFuelTanks, useSPCCTanks } from '@/hooks/useFuelTanks';
import { useFuelTankDeliveries } from '@/hooks/useFuelTankDeliveries';
import { useFuelManagementSettings } from '@/hooks/useFuelManagementSettings';
import { AddFuelTankDialog } from './AddFuelTankDialog';
import { AddTankDeliveryDialog } from './AddTankDeliveryDialog';
import { AddSupplierDialog } from './AddSupplierDialog';
import { FuelTankAlerts } from './FuelTankAlerts';
import { SuppliersList } from './SuppliersList';
import { FUEL_TYPE_LABELS, FUEL_TYPE_COLORS } from '@/types/fuel';
import { format } from 'date-fns';

export const FuelTanksManager: React.FC = () => {
  const [showAddDelivery, setShowAddDelivery] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState<string | undefined>();
  const [showSuppliers, setShowSuppliers] = useState(false);

  const { data: settings } = useFuelManagementSettings();
  const spccThreshold = settings?.spcc_tank_threshold_gallons || 1320;
  
  const { data: tanks = [], isLoading } = useFuelTanks();
  const { data: spccTanks = [] } = useSPCCTanks(spccThreshold);
  const { data: deliveries = [] } = useFuelTankDeliveries();

  const spccRequired = spccTanks.length > 0;
  const totalCapacity = tanks.reduce((sum, tank) => sum + Number(tank.capacity_gallons), 0);

  // Calculate delivery vs consumption analytics over the last 30 days
  const { data: analytics } = useQuery({
    queryKey: ['fuel-supply-analytics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('fuel_tank_deliveries')
        .select('gallons_delivered, total_cost')
        .gte('delivery_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (deliveriesError) throw deliveriesError;

      const { data: drawsData, error: drawsError } = await supabase
        .from('unified_fuel_consumption')
        .select('gallons, cost')
        .eq('source_type', 'yard_tank')
        .gte('fuel_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (drawsError) throw drawsError;

      const totalDelivered = deliveriesData?.reduce((sum, d) => sum + (d.gallons_delivered || 0), 0) || 0;
      const totalDrawn = drawsData?.reduce((sum, d) => sum + (d.gallons || 0), 0) || 0;
      const deliveryCost = deliveriesData?.reduce((sum, d) => sum + (d.total_cost || 0), 0) || 0;

      return {
        totalDelivered,
        totalDrawn,
        netChange: totalDelivered - totalDrawn,
        deliveryCost,
        deliveryCount: deliveriesData?.length || 0,
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

  const handleAddDelivery = (tankId: string) => {
    setSelectedTankId(tankId);
    setShowAddDelivery(true);
  };

  if (isLoading) {
    return <div>Loading tanks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      <FuelTankAlerts />
      
      {/* SPCC Compliance Alert */}
      {spccRequired && (
        <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900">SPCC Compliance Required</h4>
              <p className="text-sm text-amber-800 mt-1">
                You have {spccTanks.length} tank(s) with capacity ≥ {spccThreshold.toLocaleString()} gallons.
                EPA requires a Spill Prevention, Control, and Countermeasure (SPCC) plan.
              </p>
              <div className="mt-3 flex gap-2">
                <Badge variant="outline" className="bg-white">
                  {spccTanks.length} tank(s) require SPCC
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 30-Day Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Delivered</p>
            <p className="text-2xl font-bold">{analytics?.totalDelivered.toFixed(0) || 0} gal</p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Consumed</p>
            <p className="text-2xl font-bold">{analytics?.totalDrawn.toFixed(0) || 0} gal</p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Net Change</p>
            <p className={`text-2xl font-bold ${(analytics?.netChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(analytics?.netChange || 0) >= 0 ? '+' : ''}{analytics?.netChange.toFixed(0) || 0} gal
            </p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Delivery Cost</p>
            <p className="text-2xl font-bold">${analytics?.deliveryCost.toFixed(2) || '0.00'}</p>
            <p className="text-xs text-muted-foreground mt-1">{analytics?.deliveryCount || 0} deliveries</p>
          </div>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <Container className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Tanks</p>
              <p className="text-2xl font-bold">{tanks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
              <CheckCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Capacity</p>
              <p className="text-2xl font-bold">{totalCapacity.toLocaleString()} gal</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
              <Calendar className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent Deliveries</p>
              <p className="text-2xl font-bold">{deliveries.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tank Level Indicators with Progress Bars */}
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
          <Button onClick={() => setShowAddDelivery(true)}>
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

      {/* Suppliers Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="show-suppliers" className="text-base font-semibold cursor-pointer">
              View Fuel Suppliers
            </Label>
            <p className="text-sm text-muted-foreground">
              Manage your fuel tank delivery vendors
            </p>
          </div>
          <Switch
            id="show-suppliers"
            checked={showSuppliers}
            onCheckedChange={setShowSuppliers}
          />
        </div>
      </Card>

      {/* Suppliers List */}
      {showSuppliers && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Active Suppliers</h4>
          <SuppliersList />
        </div>
      )}

      {/* Tanks List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">List of Tanks</h4>
        <div className="space-y-2">
          {tanks.map((tank) => (
            <Card key={tank.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">
                      {tank.tank_name || `Tank ${tank.tank_number}`}
                    </h4>
                    <Badge className={`bg-gradient-to-r ${FUEL_TYPE_COLORS[tank.fuel_type]} text-white font-bold border-0 flex-shrink-0`}>
                      {FUEL_TYPE_LABELS[tank.fuel_type]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="truncate">#{tank.tank_number}</span>
                    <span className="flex-shrink-0">Capacity: {tank.capacity_gallons.toLocaleString()} gal</span>
                    <span className="flex-shrink-0">Current Level: {(tank.current_level_gallons || 0).toLocaleString()} gal</span>
                    {tank.requires_spcc && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium flex-shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        SPCC Required
                      </span>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAddDelivery(tank.id)}
                  className="flex-shrink-0"
                >
                  Log Delivery
                </Button>
              </div>
            </Card>
          ))}

          {tanks.length === 0 && (
            <Card className="p-8 text-center">
              <Container className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-semibold mb-2">No Fuel Tanks</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first on-site fuel tank to start tracking bulk deliveries
              </p>
              <p className="text-sm text-muted-foreground">
                Use the "Add Tank" button above to get started
              </p>
            </Card>
          )}
        </div>
      </div>

      <AddTankDeliveryDialog 
        open={showAddDelivery} 
        onOpenChange={setShowAddDelivery}
        tankId={selectedTankId}
      />
    </div>
  );
};
