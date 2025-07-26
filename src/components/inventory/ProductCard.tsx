import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Eye, MapPin, Package, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Product {
  id: string;
  name: string;
  default_price_per_day: number;
  base_image?: string;
  stock_total: number;
  stock_in_service: number;
  low_stock_threshold: number;
  track_inventory: boolean;
}

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [showLocationBreakdown, setShowLocationBreakdown] = useState(false);

  // Fetch location stock for this product
  const { data: locationStocks } = useQuery({
    queryKey: ['product-location-stock', product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_location_stock')
        .select(`
          *,
          storage_location:storage_locations(id, name)
        `)
        .eq('product_id', product.id)
        .order('quantity', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const totalLocationStock = locationStocks?.reduce((sum, ls) => sum + ls.quantity, 0) || 0;
  const locationCount = locationStocks?.length || 0;
  const availableCount = Math.max(totalLocationStock, product.stock_total) - product.stock_in_service;
  const isLowStock = availableCount <= product.low_stock_threshold;
  const isOutOfStock = availableCount <= 0;

  const getStatusBadge = () => {
    if (!product.track_inventory) {
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          Not tracked
        </Badge>
      );
    }

    if (isOutOfStock) {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0">
          <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
          Out of stock
        </Badge>
      );
    }

    if (isLowStock) {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold border-0">
          <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
          Low Stock
        </Badge>
      );
    }

    return (
      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0">
        <span className="w-2 h-2 bg-white rounded-full mr-1"></span>
        {availableCount}/{product.stock_total}
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all duration-200 group">
      {/* Top Right Stats Icon */}
      <div className="flex justify-end mb-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            // Handle stats view
          }}
        >
          <BarChart3 className="w-4 h-4 text-gray-400" />
        </Button>
      </div>

      {/* Product Image */}
      <div className="flex justify-center mb-4">
        <div className="w-52 h-52 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {product.base_image ? (
            <img
              src={product.base_image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-300 rounded"></div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="text-center space-y-3">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{product.name}</h3>
        <p className="text-blue-600 font-semibold">${product.default_price_per_day}/day</p>
        
        {/* Status Badge */}
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>

        {/* Location Information */}
        {product.track_inventory && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              {locationCount === 0 && "No location assigned"}
              {locationCount === 1 && `At 1 location`}
              {locationCount > 1 && `Across ${locationCount} locations`}
            </div>
            
            {locationCount > 1 && (
              <Collapsible open={showLocationBreakdown} onOpenChange={setShowLocationBreakdown}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs w-full justify-between"
                  >
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      View breakdown
                    </span>
                    {showLocationBreakdown ? 
                      <ChevronUp className="h-3 w-3" /> : 
                      <ChevronDown className="h-3 w-3" />
                    }
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                  {locationStocks?.map((ls) => (
                    <div key={ls.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {ls.storage_location?.name}
                      </span>
                      <span className="font-medium">{ls.quantity}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </div>

      {/* View Button */}
      <div className="mt-4">
        <Button
          onClick={onSelect}
          variant="ocean"
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
      </div>
    </div>
  );
};