import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StorageLocationSelector } from "./StorageLocationSelector";
import { toast } from "sonner";
import { MapPin, Plus, Package, Minus } from "lucide-react";

interface ProductLocationStockProps {
  productId: string;
  productName: string;
}

interface LocationStock {
  id: string;
  storage_location_id: string;
  quantity: number;
  storage_location: {
    id: string;
    name: string;
    description?: string;
  };
}

export function ProductLocationStock({ productId, productName }: ProductLocationStockProps) {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [newLocationId, setNewLocationId] = useState("");
  const [newQuantity, setNewQuantity] = useState(0);
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(0);

  // Fetch location stock for this product
  const { data: locationStocks, isLoading } = useQuery({
    queryKey: ['product-location-stock', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_location_stock')
        .select(`
          *,
          storage_location:storage_locations(id, name, description)
        `)
        .eq('product_id', productId)
        .order('quantity', { ascending: false });

      if (error) throw error;
      return data as LocationStock[];
    }
  });

  // Add stock to new location
  const addLocationStockMutation = useMutation({
    mutationFn: async ({ locationId, quantity }: { locationId: string; quantity: number }) => {
      const { error } = await supabase
        .from('product_location_stock')
        .upsert({
          product_id: productId,
          storage_location_id: locationId,
          quantity: quantity
        }, {
          onConflict: 'product_id,storage_location_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Stock added to location");
      queryClient.invalidateQueries({ queryKey: ['product-location-stock', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsAddModalOpen(false);
      setNewLocationId("");
      setNewQuantity(0);
    },
    onError: (error) => {
      console.error('Error adding location stock:', error);
      toast.error("Failed to add stock to location");
    }
  });

  // Transfer stock between locations
  const transferStockMutation = useMutation({
    mutationFn: async ({ fromId, toId, quantity }: { fromId: string; toId: string; quantity: number }) => {
      // Start a transaction by updating both locations
      const fromStock = locationStocks?.find(ls => ls.storage_location_id === fromId);
      if (!fromStock || fromStock.quantity < quantity) {
        throw new Error("Insufficient stock in source location");
      }

      // Update source location
      const { error: fromError } = await supabase
        .from('product_location_stock')
        .update({ quantity: fromStock.quantity - quantity })
        .eq('product_id', productId)
        .eq('storage_location_id', fromId);

      if (fromError) throw fromError;

      // Update or create destination location stock
      const toStock = locationStocks?.find(ls => ls.storage_location_id === toId);
      const newToQuantity = (toStock?.quantity || 0) + quantity;

      const { error: toError } = await supabase
        .from('product_location_stock')
        .upsert({
          product_id: productId,
          storage_location_id: toId,
          quantity: newToQuantity
        }, {
          onConflict: 'product_id,storage_location_id'
        });

      if (toError) throw toError;
    },
    onSuccess: () => {
      toast.success("Stock transferred successfully");
      queryClient.invalidateQueries({ queryKey: ['product-location-stock', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsTransferModalOpen(false);
      setTransferFromId("");
      setTransferToId("");
      setTransferQuantity(0);
    },
    onError: (error) => {
      console.error('Error transferring stock:', error);
      toast.error(error.message || "Failed to transfer stock");
    }
  });

  const handleAddStock = () => {
    if (!newLocationId || newQuantity <= 0) {
      toast.error("Please select a location and enter a valid quantity");
      return;
    }

    addLocationStockMutation.mutate({ locationId: newLocationId, quantity: newQuantity });
  };

  const handleTransferStock = () => {
    if (!transferFromId || !transferToId || transferQuantity <= 0) {
      toast.error("Please select both locations and enter a valid quantity");
      return;
    }

    if (transferFromId === transferToId) {
      toast.error("Source and destination locations must be different");
      return;
    }

    transferStockMutation.mutate({ 
      fromId: transferFromId, 
      toId: transferToId, 
      quantity: transferQuantity 
    });
  };

  const totalStock = locationStocks?.reduce((sum, ls) => sum + ls.quantity, 0) || 0;

  if (isLoading) {
    return <div className="text-center py-4">Loading location stock...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Stock by Location</h3>
          <p className="text-sm text-muted-foreground">
            Total: {totalStock} units across {locationStocks?.length || 0} locations
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add to Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock to Location</DialogTitle>
                <DialogDescription>
                  Add {productName} inventory to a storage location
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Storage Location</Label>
                  <StorageLocationSelector
                    value={newLocationId}
                    onValueChange={setNewLocationId}
                    placeholder="Select storage location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddStock}
                    disabled={addLocationStockMutation.isPending}
                  >
                    {addLocationStockMutation.isPending ? "Adding..." : "Add Stock"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Stock</DialogTitle>
                <DialogDescription>
                  Move {productName} inventory between storage locations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>From Location</Label>
                  <StorageLocationSelector
                    value={transferFromId}
                    onValueChange={setTransferFromId}
                    placeholder="Select source location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Location</Label>
                  <StorageLocationSelector
                    value={transferToId}
                    onValueChange={setTransferToId}
                    placeholder="Select destination location"
                    excludeLocationId={transferFromId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity to Transfer</Label>
                  <Input
                    type="number"
                    min="1"
                    max={locationStocks?.find(ls => ls.storage_location_id === transferFromId)?.quantity || 0}
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                  />
                  {transferFromId && (
                    <p className="text-xs text-muted-foreground">
                      Available: {locationStocks?.find(ls => ls.storage_location_id === transferFromId)?.quantity || 0} units
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleTransferStock}
                    disabled={transferStockMutation.isPending}
                  >
                    {transferStockMutation.isPending ? "Transferring..." : "Transfer Stock"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {locationStocks?.map((locationStock) => (
          <Card key={locationStock.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{locationStock.storage_location.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{locationStock.quantity} units</span>
                </div>
              </div>
              {locationStock.storage_location.description && (
                <CardDescription>{locationStock.storage_location.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}

        {(!locationStocks || locationStocks.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No location stock assigned for this product
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Location
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}