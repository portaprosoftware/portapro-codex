import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Droplets, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { useFuelTanks, useSPCCTanks } from '@/hooks/useFuelTanks';
import { useFuelTankDeliveries } from '@/hooks/useFuelTankDeliveries';
import { AddFuelTankDialog } from './AddFuelTankDialog';
import { AddTankDeliveryDialog } from './AddTankDeliveryDialog';
import { FUEL_TYPE_LABELS, FUEL_TYPE_COLORS } from '@/types/fuel';
import { format } from 'date-fns';

export const FuelTanksManager: React.FC = () => {
  const [showAddTank, setShowAddTank] = useState(false);
  const [showAddDelivery, setShowAddDelivery] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState<string | undefined>();

  const { data: tanks = [], isLoading } = useFuelTanks();
  const { data: spccTanks = [] } = useSPCCTanks();
  const { data: deliveries = [] } = useFuelTankDeliveries();

  const spccRequired = spccTanks.length > 0;
  const totalCapacity = tanks.reduce((sum, tank) => sum + Number(tank.capacity_gallons), 0);

  const handleAddDelivery = (tankId: string) => {
    setSelectedTankId(tankId);
    setShowAddDelivery(true);
  };

  if (isLoading) {
    return <div>Loading tanks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* SPCC Compliance Alert */}
      {spccRequired && (
        <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900">SPCC Compliance Required</h4>
              <p className="text-sm text-amber-800 mt-1">
                Total tank capacity ({totalCapacity.toLocaleString()} gal) exceeds 1,320 gallons.
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Droplets className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Tanks</p>
              <p className="text-2xl font-bold">{tanks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Capacity</p>
              <p className="text-2xl font-bold">{totalCapacity.toLocaleString()} gal</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent Deliveries</p>
              <p className="text-2xl font-bold">{deliveries.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Tank Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fuel Tanks</h3>
        <Button onClick={() => setShowAddTank(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tank
        </Button>
      </div>

      {/* Tanks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tanks.map((tank) => (
          <Card key={tank.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{tank.tank_name || `Tank ${tank.tank_number}`}</h4>
                  <p className="text-sm text-muted-foreground">#{tank.tank_number}</p>
                </div>
                <Badge className={`bg-gradient-to-r ${FUEL_TYPE_COLORS[tank.fuel_type]} text-white font-bold border-0`}>
                  {FUEL_TYPE_LABELS[tank.fuel_type]}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-semibold">{tank.capacity_gallons.toLocaleString()} gal</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Level</p>
                  <p className="font-semibold">{tank.meter_current_reading.toLocaleString()} gal</p>
                </div>
              </div>

              {tank.requires_spcc && (
                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                  <span className="text-amber-600 font-medium">SPCC Required</span>
                </div>
              )}

              {tank.last_inspection_date && (
                <div className="text-xs text-muted-foreground">
                  Last inspection: {format(new Date(tank.last_inspection_date), 'MMM d, yyyy')}
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleAddDelivery(tank.id)}
              >
                Log Delivery
              </Button>
            </div>
          </Card>
        ))}

        {tanks.length === 0 && (
          <Card className="p-8 col-span-full text-center">
            <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-semibold mb-2">No Fuel Tanks</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first on-site fuel tank to start tracking bulk deliveries
            </p>
            <Button onClick={() => setShowAddTank(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tank
            </Button>
          </Card>
        )}
      </div>

      <AddFuelTankDialog open={showAddTank} onOpenChange={setShowAddTank} />
      <AddTankDeliveryDialog 
        open={showAddDelivery} 
        onOpenChange={setShowAddDelivery}
        tankId={selectedTankId}
      />
    </div>
  );
};
