import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Eye, MapPin, Package, ChevronDown, ChevronUp, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

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

  // Fetch quick stats for hover card
  const { data: quickStats } = useQuery({
    queryKey: ['product-quick-stats', product.id],
    queryFn: async () => {
      // Get recent equipment assignments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: assignments, error: assignmentsError } = await supabase
        .from('equipment_assignments')
        .select('id, assigned_date, return_date, status')
        .eq('product_id', product.id)
        .gte('assigned_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (assignmentsError) throw assignmentsError;

      // Get total individual items count
      const { data: items, error: itemsError } = await supabase
        .from('product_items')
        .select('id, status')
        .eq('product_id', product.id);

      if (itemsError) throw itemsError;

      const activeAssignments = assignments?.filter(a => a.status === 'assigned').length || 0;
      const completedAssignments = assignments?.filter(a => a.status === 'returned').length || 0;
      const totalItems = items?.length || 0;
      const utilizationRate = totalItems > 0 ? Math.round((activeAssignments / totalItems) * 100) : 0;

      return {
        activeAssignments,
        completedAssignments,
        totalItems,
        utilizationRate,
        recentActivity: assignments?.length || 0
      };
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
      {/* Top Right Stats Icon with Hover Card */}
      <div className="flex justify-end mb-3">
        <HoverCard openDelay={0}>
          <HoverCardTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 transition-all"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <BarChart3 className="w-4 h-4 text-gray-600 hover:text-gray-900 transition-colors" />
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80" side="left">
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-600">Quick Statistics</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Stock</p>
                  <p className="text-lg font-bold text-gray-900">{product.stock_total}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available</p>
                  <p className="text-lg font-bold text-green-600">{availableCount}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In Service</p>
                  <p className="text-lg font-bold text-blue-600">{product.stock_in_service}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Utilization</p>
                  <p className="text-lg font-bold text-purple-600">{quickStats?.utilizationRate || 0}%</p>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Active Assignments
                  </span>
                  <span className="font-medium">{quickStats?.activeAssignments || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Recent Activity (30d)
                  </span>
                  <span className="font-medium">{quickStats?.recentActivity || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Storage Locations
                  </span>
                  <span className="font-medium">{locationCount}</span>
                </div>
              </div>

              <div className="border-t pt-2">
                <p className="text-xs text-gray-500">Daily Rate: <span className="font-medium text-gray-700">${product.default_price_per_day}</span></p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
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
          variant="outline"
          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
      </div>
    </div>
  );
};