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
import { MapPin, Package, ArrowLeftRight, Clock } from "lucide-react";
import { ProductLocationTransferHistory } from "./ProductLocationTransferHistory";

interface ProductLocationStockProps {
  productId: string;
  productName: string;
}

interface LocationStock {
  location_id: string;
  location_name: string;
  location_description?: string;
  unit_count: number;
}

export function ProductLocationStock({ productId, productName }: ProductLocationStockProps) {
  const queryClient = useQueryClient();
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTransferHistoryOpen, setIsTransferHistoryOpen] = useState(false);
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(0);
  const [transferNotes, setTransferNotes] = useState("");

  // Fetch individual units count by location for this product - optimized query
  const { data: locationStocks, isLoading } = useQuery({
    queryKey: ['product-individual-location-stock', productId],
    queryFn: async () => {
      console.log('ProductLocationStock query starting for productId:', productId);
      
      // Use a simpler query approach that we know works
      const { data, error } = await supabase
        .from('product_items')
        .select(`
          current_storage_location_id,
          storage_locations (
            id,
            name,
            description
          )
        `)
        .eq('product_id', productId)
        .not('current_storage_location_id', 'is', null);

      console.log('ProductLocationStock query response:', { data, error, productId });

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No units found with locations for product:', productId);
        return [];
      }

      // Group by location and count
      const locationCounts: { [key: string]: LocationStock } = {};
      
      data.forEach((item) => {
        const locationId = item.current_storage_location_id;
        const location = Array.isArray(item.storage_locations) 
          ? item.storage_locations[0] 
          : item.storage_locations;
        
        console.log('Processing item:', { locationId, location, item });
        
        if (locationId && location) {
          if (!locationCounts[locationId]) {
            locationCounts[locationId] = {
              location_id: locationId,
              location_name: location.name || 'Unknown Location',
              location_description: location.description || undefined,
              unit_count: 0
            };
          }
          locationCounts[locationId].unit_count += 1;
        }
      });

      const result = Object.values(locationCounts).sort((a, b) => a.location_name.localeCompare(b.location_name));
      console.log('Final location stocks:', result);
      return result;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000 // Data considered fresh for 10 seconds
  });




  const totalStock = locationStocks?.reduce((sum, ls) => sum + ls.unit_count, 0) || 0;

  if (isLoading) {
    return <div className="text-center py-4">Loading location stock...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Individual Units by Location</h3>
          <p className="text-sm text-muted-foreground">
            Total: {totalStock} individual units across {locationStocks?.length || 0} locations
          </p>
          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 This shows where your individually tracked units are located. Use the "Transfer Locations" feature in the Stock List tab to move multiple units at once.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsTransferHistoryOpen(true)}
          >
            <Clock className="h-4 w-4 mr-2" />
            View Transfer History
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {locationStocks?.map((locationStock) => (
          <Card key={locationStock.location_id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{locationStock.location_name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{locationStock.unit_count} units</span>
                </div>
              </div>
              {locationStock.location_description && (
                <CardDescription>{locationStock.location_description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}

        {(!locationStocks || locationStocks.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No individual units have been assigned to storage locations yet. Units can be moved to locations using the "Transfer Locations" feature in the Stock List tab.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transfer History Dialog */}
      <Dialog open={isTransferHistoryOpen} onOpenChange={setIsTransferHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Location Transfer History - {productName}</DialogTitle>
            <DialogDescription>
              View all location-to-location transfers for this product
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto">
            <ProductLocationTransferHistory 
              productId={productId} 
              productName={productName} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}