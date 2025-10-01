import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Warehouse, Truck, Building2, MapPin, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { SpillKitStockTransferModal } from "./SpillKitStockTransferModal";
import { Skeleton } from "@/components/ui/skeleton";

export const SpillKitLocationStockManager: React.FC = () => {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<{ itemId?: string; fromLocationId?: string }>({});

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['storage-locations-with-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: stockByLocation, isLoading: stockLoading, refetch } = useQuery({
    queryKey: ['spill_kit_location_stock_detailed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_kit_location_stock')
        .select(`
          *,
          inventory:spill_kit_inventory!inner(id, item_name, category),
          location:spill_kit_storage_locations!inner(id, name, location_type)
        `);
      if (error) throw error;
      return data;
    }
  });

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return <Warehouse className="h-4 w-4" />;
      case 'vehicle': return <Truck className="h-4 w-4" />;
      case 'facility': return <Building2 className="h-4 w-4" />;
      case 'mobile': return <MapPin className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= threshold) return { label: "Low Stock", variant: "warning" as const };
    return { label: "In Stock", variant: "success" as const };
  };

  const handleTransferClick = (itemId: string, fromLocationId: string) => {
    setSelectedTransfer({ itemId, fromLocationId });
    setTransferModalOpen(true);
  };

  if (locationsLoading || stockLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Group stock by location
  const stockGroupedByLocation = locations?.map(location => ({
    ...location,
    stock: stockByLocation?.filter(s => s.storage_location_id === location.id) || []
  })) || [];

  const totalLocations = locations?.length || 0;
  const totalStockItems = stockByLocation?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;
  const lowStockCount = stockByLocation?.filter(s => s.quantity <= s.low_stock_threshold).length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Locations</p>
              <p className="text-2xl font-bold">{totalLocations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Stock Items</p>
              <p className="text-2xl font-bold">{totalStockItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stock by Location */}
      {stockGroupedByLocation.map(location => (
        <Card key={location.id} className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getLocationIcon(location.location_type)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{location.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {location.location_type} • {location.stock.length} items
                  </p>
                </div>
              </div>
              <Badge variant={location.is_default ? "default" : "secondary"}>
                {location.is_default ? "Default" : "Active"}
              </Badge>
            </div>
          </div>

          {location.stock.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Low Stock Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {location.stock.map((stock: any) => {
                  const status = getStockStatus(stock.quantity, stock.low_stock_threshold);
                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.inventory.item_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stock.inventory.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{stock.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {stock.low_stock_threshold}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTransferClick(stock.inventory_item_id, location.id)}
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          Transfer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No stock at this location</p>
            </div>
          )}
        </Card>
      ))}

      {stockGroupedByLocation.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Storage Locations</h3>
          <p className="text-muted-foreground">
            Create storage locations to track your spill kit inventory across different facilities.
          </p>
        </Card>
      )}

      <SpillKitStockTransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        inventoryItemId={selectedTransfer.itemId}
        fromLocationId={selectedTransfer.fromLocationId}
        onSuccess={() => {
          refetch();
          setSelectedTransfer({});
        }}
      />
    </div>
  );
};
