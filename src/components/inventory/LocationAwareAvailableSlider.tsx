import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, MapPin, ChevronDown, ChevronUp, Building } from "lucide-react";

interface AvailableNowSliderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductLocationStock {
  id: string;
  product_id: string;
  storage_location_id: string;
  quantity: number;
  storage_location: {
    id: string;
    name: string;
    description?: string;
  };
  product: {
    id: string;
    name: string;
    default_price_per_day: number;
  };
}

export function AvailableNowSlider({ isOpen, onClose }: AvailableNowSliderProps) {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  // Fetch all available stock by location
  const { data: locationStocks, isLoading } = useQuery({
    queryKey: ['available-now-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_location_stock')
        .select(`
          *,
          storage_location:storage_locations(id, name, description),
          product:products(id, name, default_price_per_day, track_inventory)
        `)
        .gt('quantity', 0)
        .order('quantity', { ascending: false });

      if (error) throw error;
      return data as ProductLocationStock[];
    },
    enabled: isOpen
  });

  // Group by storage location
  const stockByLocation = locationStocks?.reduce((acc, stock) => {
    const locationId = stock.storage_location_id;
    if (!acc[locationId]) {
      acc[locationId] = {
        location: stock.storage_location,
        products: []
      };
    }
    acc[locationId].products.push(stock);
    return acc;
  }, {} as { [key: string]: { location: any; products: ProductLocationStock[] } });

  const toggleSection = (locationId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  const totalItems = locationStocks?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
  const locationCount = Object.keys(stockByLocation || {}).length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Available Now
          </SheetTitle>
          <SheetDescription>
            Real-time inventory available across all storage locations
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">Units ready for rental</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Storage Sites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{locationCount}</div>
                <p className="text-xs text-muted-foreground">Active locations</p>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Stock by Location */}
          {stockByLocation && Object.entries(stockByLocation).map(([locationId, { location, products }]) => {
            const isOpen = openSections[locationId];
            const totalAtLocation = products.reduce((sum, p) => sum + p.quantity, 0);

            return (
              <Card key={locationId}>
                <Collapsible open={isOpen} onOpenChange={() => toggleSection(locationId)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-base">{location.name}</CardTitle>
                            {location.description && (
                              <p className="text-sm text-muted-foreground">{location.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-medium">
                            {totalAtLocation} units
                          </Badge>
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {products.map((stock) => (
                          <div key={stock.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{stock.product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${stock.product.default_price_per_day}/day
                                </p>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              {stock.quantity} available
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}

          {/* Empty State */}
          {!isLoading && (!locationStocks || locationStocks.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No inventory available</p>
                <p className="text-sm text-muted-foreground text-center">
                  Add products to storage locations to see availability here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}