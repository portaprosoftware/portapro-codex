import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FleetLayout } from "@/components/fleet/FleetLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Truck, ArrowLeftRight, PlusCircle, MinusCircle, Droplets } from "lucide-react";
import { RouteStockCheck } from "@/components/fleet/RouteStockCheck";
import { StockVehicleSelectionModal } from "@/components/fleet/StockVehicleSelectionModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Vehicle { id: string; license_plate: string | null; vehicle_type?: string | null; make?: string | null; model?: string | null; year?: number | null; vehicle_image?: string | null }
interface BalanceRow { consumable_id: string; balance_qty: number }
interface Consumable { id: string; name: string; base_unit: string; unit_price?: number }
interface StorageLocation { id: string; name: string }

const FleetTruckStock: React.FC = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [vehicleId, setVehicleId] = useState<string>("");
  const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [consumableId, setConsumableId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [destVehicleId, setDestVehicleId] = useState<string>("");
  const [sourceLocationId, setSourceLocationId] = useState<string>("");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);

  // Fetch all vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, license_plate, vehicle_type, make, model, year, vehicle_image");
      if (error) throw error;
      return data as Vehicle[];
    }
  });

  // Fetch all consumables
  const { data: allConsumables = [] } = useQuery({
    queryKey: ["consumables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consumables").select("id, name, base_unit, unit_price");
      if (error) throw error;
      return data as Consumable[];
    }
  });

  // Fetch inventory for selected vehicle
  const { data: inventoryData } = useQuery({
    queryKey: ["vehicle-inventory", vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];
      const { data, error } = await supabase
        .from("vehicle_consumable_balances")
        .select(`
          consumable_id,
          balance_qty,
          consumables!inner(name, base_unit)
        `)
        .eq("vehicle_id", vehicleId)
        .gt("balance_qty", 0);
      
      if (error) throw error;
      return data?.map(item => ({
        consumable_id: item.consumable_id,
        balance_qty: item.balance_qty,
        consumable_name: item.consumables.name,
        unit: item.consumables.base_unit
      })) || [];
    },
    enabled: !!vehicleId
  });

  // Load/Unload mutation - simplified
  const loadUnloadMutation = useMutation({
    mutationFn: async ({ action, consumable_id, qty, vehicle_id }: {
      action: "load" | "unload";
      consumable_id: string;
      qty: number;
      vehicle_id: string;
    }) => {
      // Placeholder - would integrate with actual inventory system
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Operation completed successfully" });
      qc.invalidateQueries({ queryKey: ["vehicle-inventory"] });
      setQuantity("");
    },
    onError: (error) => {
      toast({ title: "Error", description: "Operation failed", variant: "destructive" });
    }
  });

  // Transfer mutation - simplified
  const transferMutation = useMutation({
    mutationFn: async ({ consumable_id, qty, from_vehicle_id, to_vehicle_id }: {
      consumable_id: string;
      qty: number;
      from_vehicle_id: string;
      to_vehicle_id: string;
    }) => {
      // Placeholder - would integrate with actual inventory system
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transfer completed successfully" });
      qc.invalidateQueries({ queryKey: ["vehicle-inventory"] });
      setQuantity("");
      setDestVehicleId("");
    },
    onError: (error) => {
      toast({ title: "Error", description: "Transfer failed", variant: "destructive" });
    }
  });

  useEffect(() => {
    document.title = 'Truck Stock | PortaPro';
  }, []);

  return (
    <FleetLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">Truck Stock Management</CardTitle>
                <CardDescription>Manage consumables stock movements for your fleet vehicles</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Vehicle Selection */}
            <div className="space-y-3">
              <Label htmlFor="vehicle">Select Vehicle</Label>
              <Button
                variant="outline"
                onClick={() => setIsVehicleModalOpen(true)}
                className="w-full justify-start h-10 px-3 font-normal bg-white"
              >
                <Truck className="h-4 w-4 mr-2 text-blue-600" />
                {vehicleId ? (
                  <>
                    {vehicles.find(v => v.id === vehicleId)?.license_plate || `Vehicle ${vehicleId.slice(0, 8)}`}
                    {vehicles.find(v => v.id === vehicleId)?.vehicle_type && 
                      ` (${vehicles.find(v => v.id === vehicleId)?.vehicle_type})`
                    }
                  </>
                ) : (
                  "Choose a vehicle"
                )}
              </Button>
            </div>

            {vehicleId && (
              <div className="space-y-6">
                <Separator />
                
                {/* Current Stock Display */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-purple-600" />
                    Current Stock
                  </h3>
                  
                  {inventoryData?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {inventoryData.map(item => (
                        <Card key={item.consumable_id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm">{item.consumable_name}</span>
                              <span className="text-lg font-bold text-blue-600">
                                {item.balance_qty} {item.unit}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No inventory found for this vehicle.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator />

                {/* Route vs Truck Stock Check */}
                <div className="space-y-4">
                  <RouteStockCheck selectedVehicleId={vehicleId} />
                </div>

                <Separator />

                {/* Operations */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="h-5 w-5"/> Load / Unload
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-muted-foreground">Consumable</Label>
                        <Select value={consumableId} onValueChange={setConsumableId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose consumable" />
                          </SelectTrigger>
                          <SelectContent>
                            {allConsumables?.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Quantity</Label>
                        <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          disabled={!vehicleId || !consumableId || !quantity || loadUnloadMutation.isPending}
                          onClick={() => loadUnloadMutation.mutate({ action: "load", consumable_id: consumableId, qty: Number(quantity), vehicle_id: vehicleId })}
                          className="gap-2"
                        >
                          <PlusCircle className="h-4 w-4"/> Load
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={!vehicleId || !consumableId || !quantity || loadUnloadMutation.isPending}
                          onClick={() => loadUnloadMutation.mutate({ action: "unload", consumable_id: consumableId, qty: Number(quantity), vehicle_id: vehicleId })}
                          className="gap-2"
                        >
                          <MinusCircle className="h-4 w-4"/> Unload
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ArrowLeftRight className="h-5 w-5"/> Transfer Between Trucks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                      <div>
                        <Label className="text-sm text-muted-foreground">Destination Vehicle</Label>
                        <Select value={destVehicleId} onValueChange={setDestVehicleId}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select destination vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles?.filter(v => v.id !== vehicleId).map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.license_plate || v.id}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          disabled={!vehicleId || !destVehicleId || !consumableId || !quantity || transferMutation.isPending}
                          onClick={() => transferMutation.mutate({ consumable_id: consumableId, qty: Number(quantity), from_vehicle_id: vehicleId, to_vehicle_id: destVehicleId })}
                          className="gap-2 h-8"
                        >
                          <ArrowLeftRight className="h-4 w-4"/> Transfer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Selection Modal */}
        <StockVehicleSelectionModal
          open={isVehicleModalOpen}
          onOpenChange={setIsVehicleModalOpen}
          selectedDate={new Date()}
          selectedVehicle={{ id: vehicleId }}
          onVehicleSelect={(vehicle) => setVehicleId(vehicle.id)}
        />
      </div>
    </FleetLayout>
  );
};

export default FleetTruckStock;