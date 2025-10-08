import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Container, AlertTriangle, CheckCircle, Calendar, Truck, Building2 } from 'lucide-react';
import { useFuelTanks, useSPCCTanks } from '@/hooks/useFuelTanks';
import { useFuelTankDeliveries } from '@/hooks/useFuelTankDeliveries';
import { AddFuelTankDialog } from './AddFuelTankDialog';
import { AddTankDeliveryDialog } from './AddTankDeliveryDialog';
import { AddSupplierDialog } from './AddSupplierDialog';
import { FuelTankAlerts } from './FuelTankAlerts';
import { SuppliersList } from './SuppliersList';
import { FUEL_TYPE_LABELS, FUEL_TYPE_COLORS } from '@/types/fuel';
import { format } from 'date-fns';

export const FuelTanksManager: React.FC = () => {
  const [showAddTank, setShowAddTank] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddDelivery, setShowAddDelivery] = useState(false);
  const [selectedTankId, setSelectedTankId] = useState<string | undefined>();
  const [showSuppliers, setShowSuppliers] = useState(false);

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

      {/* Add Tank & Supplier Buttons */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fuel Tanks</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddSupplier(true)}>
            <Truck className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
          <Button onClick={() => setShowAddTank(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tank
          </Button>
        </div>
      </div>

      {/* Suppliers Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="show-suppliers" className="text-base font-semibold cursor-pointer">
                View Fuel Suppliers
              </Label>
              <p className="text-sm text-muted-foreground">
                Manage your fuel tank delivery vendors
              </p>
            </div>
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
              <Button onClick={() => setShowAddTank(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tank
              </Button>
            </Card>
          )}
        </div>
      </div>

      <AddFuelTankDialog open={showAddTank} onOpenChange={setShowAddTank} />
      <AddSupplierDialog open={showAddSupplier} onOpenChange={setShowAddSupplier} />
      <AddTankDeliveryDialog 
        open={showAddDelivery} 
        onOpenChange={setShowAddDelivery}
        tankId={selectedTankId}
      />
    </div>
  );
};
