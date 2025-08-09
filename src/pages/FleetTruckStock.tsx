import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Truck, ArrowLeftRight, PlusCircle, MinusCircle, Sparkles } from "lucide-react";
import { RouteStockCheck } from "@/components/fleet/RouteStockCheck";

interface Vehicle { id: string; license_plate: string | null; vehicle_type?: string | null }
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

  useEffect(() => { document.title = "Truck Stock | PortaPro"; }, []);

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-basic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles" as any)
        .select("id, license_plate, vehicle_type")
        .order("license_plate");
      if (error) throw error;
      return (data ?? []) as unknown as Vehicle[];
    }
  });

  const { data: storageLocations } = useQuery({
    queryKey: ["storage-locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("storage_locations" as any).select("id, name").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as StorageLocation[];
    }
  });

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ["vehicle-balances", vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("vehicle_consumable_balances" as any)
        .select("consumable_id, balance_qty")
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
      const ids = (rows || []).map((r: any) => r.consumable_id);
      if (!ids.length) return [] as (BalanceRow & { consumable?: Consumable })[];
      const { data: cons, error: cErr } = await supabase
        .from("consumables" as any)
        .select("id, name, base_unit, unit_price")
        .in("id", ids);
      if (cErr) throw cErr;
      const map = new Map((cons || []).map((c: any) => [c.id, c]));
      return (rows || []).map((r: any) => ({ ...r, consumable: map.get(r.consumable_id) })) as (BalanceRow & { consumable?: Consumable })[];
    }
  });

  const { data: allConsumables } = useQuery({
    queryKey: ["consumables-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumables" as any)
        .select("id, name, base_unit")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Consumable[];
    }
  });

  const loadUnloadMutation = useMutation({
    mutationFn: async (params: { action: "load" | "unload"; consumable_id: string; qty: number; vehicle_id: string; storage_location_id?: string }) => {
      const { action, consumable_id, qty, vehicle_id, storage_location_id } = params;
      const { error } = await supabase.from("consumable_stock_ledger" as any).insert({
        type: action,
        consumable_id,
        qty,
        vehicle_id,
        storage_location_id: storage_location_id || null,
        notes: action === "load" ? "Loaded to vehicle" : "Unloaded from vehicle",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Success", description: "Ledger updated." });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["vehicle-balances", vehicleId] }),
        qc.invalidateQueries({ queryKey: ["route-stock-status"] })
      ]);
      setQuantity("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const transferMutation = useMutation({
    mutationFn: async (params: { consumable_id: string; qty: number; from_vehicle_id: string; to_vehicle_id: string }) => {
      const { consumable_id, qty, from_vehicle_id, to_vehicle_id } = params;
      const { error } = await supabase.from("consumable_stock_ledger" as any).insert([
        { type: "transfer_out", consumable_id, qty, vehicle_id: from_vehicle_id, notes: `Transfer to ${to_vehicle_id}` },
        { type: "transfer_in", consumable_id, qty, vehicle_id: to_vehicle_id, notes: `Transfer from ${from_vehicle_id}` }
      ]);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Transferred", description: "Stock moved between vehicles." });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["vehicle-balances", vehicleId] }),
        qc.invalidateQueries({ queryKey: ["vehicle-balances", destVehicleId] })
      ]);
      setQuantity("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  const { data: routeStatus } = useQuery({
    queryKey: ["route-stock-status", vehicleId, serviceDate],
    enabled: !!vehicleId && !!serviceDate,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_route_stock_status", {
        vehicle_uuid: vehicleId,
        service_date: serviceDate,
      });
      if (error) throw error;
      return data || [];
    }
  });

  const deficits = useMemo(() => (routeStatus || []).filter((r: any) => r.deficit > 0), [routeStatus]);

  const autoLoadDeficits = useMutation({
    mutationFn: async () => {
      if (!vehicleId) throw new Error("Select a vehicle");
      if (!sourceLocationId) throw new Error("Select a source location");
      const inserts = deficits.map((d: any) => ({
        type: "load",
        consumable_id: d.consumable_id,
        qty: d.deficit,
        vehicle_id: vehicleId,
        storage_location_id: sourceLocationId,
        notes: `Auto-load for route ${serviceDate}`
      }));
      if (!inserts.length) return;
      const { error } = await supabase.from("consumable_stock_ledger" as any).insert(inserts);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Pick list posted", description: "Deficits loaded to truck." });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["vehicle-balances", vehicleId] }),
        qc.invalidateQueries({ queryKey: ["route-stock-status", vehicleId, serviceDate] })
      ]);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" })
  });

  return (
    <div className="flex h-screen bg-background">
      <FleetSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold">Truck Stock</h1>
            <p className="text-sm text-muted-foreground">Per-vehicle consumable balances and quick load/unload/transfer actions.</p>
          </header>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5"/> Select Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-sm text-muted-foreground">Vehicle</label>
                  <Select value={vehicleId} onValueChange={setVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.license_plate || v.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Service Date</label>
                  <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Source Location (for loads)</label>
                  <Select value={sourceLocationId} onValueChange={setSourceLocationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source location" />
                    </SelectTrigger>
                    <SelectContent>
                      {storageLocations?.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button disabled={!vehicleId || !sourceLocationId || !deficits.length || autoLoadDeficits.isPending} onClick={() => autoLoadDeficits.mutate()} className="gap-2">
                    <Sparkles className="h-4 w-4"/> Auto‑load deficits
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5"/> Current Balances</CardTitle>
                </CardHeader>
                <CardContent>
                  {!vehicleId ? (
                    <div className="text-sm text-muted-foreground">Select a vehicle to view balances.</div>
                  ) : balancesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Consumable</TableHead>
                          <TableHead className="w-24 text-right">Qty</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(balances || []).map((row: any) => (
                          <TableRow key={row.consumable_id}>
                            <TableCell className="font-medium">{row.consumable?.name || row.consumable_id}</TableCell>
                            <TableCell className="text-right">{row.balance_qty}</TableCell>
                            <TableCell>{row.consumable?.base_unit || "unit"}</TableCell>
                            <TableCell>
                              {row.balance_qty > 0 ? (
                                <Badge variant="secondary">OK</Badge>
                              ) : (
                                <Badge variant="destructive">Empty</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5"/> Load / Unload</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Consumable</label>
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
                    <label className="text-sm text-muted-foreground">Quantity</label>
                    <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={!vehicleId || !consumableId || !quantity || loadUnloadMutation.isPending}
                      onClick={() => loadUnloadMutation.mutate({ action: "load", consumable_id: consumableId, qty: Number(quantity), vehicle_id: vehicleId, storage_location_id: sourceLocationId || undefined })}
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5"/> Transfer Between Trucks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Destination Vehicle</label>
                    <Select value={destVehicleId} onValueChange={setDestVehicleId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles?.filter(v => v.id !== vehicleId).map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.license_plate || v.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={!vehicleId || !destVehicleId || !consumableId || !quantity || transferMutation.isPending}
                      onClick={() => transferMutation.mutate({ consumable_id: consumableId, qty: Number(quantity), from_vehicle_id: vehicleId, to_vehicle_id: destVehicleId })}
                      className="gap-2"
                    >
                      <ArrowLeftRight className="h-4 w-4"/> Transfer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6">
            <RouteStockCheck />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FleetTruckStock;
