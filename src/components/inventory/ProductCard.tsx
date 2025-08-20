import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Eye, MapPin, Package, ChevronDown, ChevronUp, Calendar, TrendingUp, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useUnifiedStockManagement } from "@/hooks/useUnifiedStockManagement";

interface Product {
  id: string;
  name: string;
  default_price_per_day: number;
  image_url?: string;
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
  const queryClient = useQueryClient();
  const [showLocationBreakdown, setShowLocationBreakdown] = useState(false);
  const [showEquipmentBreakdown, setShowEquipmentBreakdown] = useState(false);

  // Use unified stock management for accurate calculations
  const { stockData, calculations, isLoading: isStockLoading } = useUnifiedStockManagement(product.id);

  // Set up real-time subscription for this product's items
  useEffect(() => {
    console.log(`ProductCard: Setting up real-time subscription for product ${product.id}`);
    const channel = supabase
      .channel(`product-${product.id}-stats-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_items',
          filter: `product_id=eq.${product.id}`
        },
        (payload) => {
          console.log(`ProductCard: Product ${product.id} items change detected:`, payload);
          // Invalidate this product's stats query to refresh the counts
          queryClient.invalidateQueries({ queryKey: ["product-stats", product.id] });
        }
      )
      .subscribe();

    return () => {
      console.log(`ProductCard: Cleaning up real-time subscription for product ${product.id}`);
      supabase.removeChannel(channel);
    };
  }, [product.id, queryClient]);

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
  
  // Use unified stock management for accurate calculations
  const availableCount = stockData?.totals?.physically_available || 0;
  const inMaintenanceCount = stockData?.individual_items?.maintenance || 0;
  const onJobCount = stockData?.individual_items?.assigned || 0;
  
  
  // Badge logic removed - will be replaced with unified badge system

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
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Utilization</p>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-3 h-3 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center cursor-help">
                            ?
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">
                            Utilization rate shows what percentage of your total stock is currently assigned or in service. 
                            Higher rates indicate better equipment usage but may suggest need for more inventory.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                    Storage Sites
                  </span>
                  <span className="font-medium">{locationCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Tracked Units
                  </span>
                  <span className="font-medium">{quickStats?.totalItems || 0}</span>
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
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-300 rounded"></div>
          )}
        </div>
      </div>

      {/* Available Count Badge */}
      <div className="flex justify-center mb-3">
        <Badge variant="success" className="text-xs px-2 py-1">
          {availableCount} Available
        </Badge>
      </div>

      {/* Product Info */}
      <div className="text-center space-y-3">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{product.name}</h3>
        <p className="text-blue-600 font-semibold">${product.default_price_per_day}/day</p>
        
        {/* Status Badge removed - will be replaced with unified badge system */}

        {/* Location Information */}
        {product.track_inventory && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              {locationCount === 0 && "No site assigned"}
              {locationCount === 1 && `At 1 site`}
              {locationCount > 1 && `Across ${locationCount} sites`}
            </div>
            
            {/* Location breakdown button */}
            <Collapsible open={showLocationBreakdown} onOpenChange={setShowLocationBreakdown}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs w-full justify-between"
                >
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    View by location
                  </span>
                  {showLocationBreakdown ? 
                    <ChevronUp className="h-3 w-3" /> : 
                    <ChevronDown className="h-3 w-3" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                {locationStocks && locationStocks.length > 0 ? (
                  locationStocks.map((ls) => (
                    <div key={ls.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {ls.storage_location?.name}
                      </span>
                      <span className="font-medium">{ls.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No site assignments
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Equipment status breakdown */}
            <Collapsible open={showEquipmentBreakdown} onOpenChange={setShowEquipmentBreakdown}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs w-full justify-between"
                >
                  <span className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    View by status
                  </span>
                  {showEquipmentBreakdown ? 
                    <ChevronUp className="h-3 w-3" /> : 
                    <ChevronDown className="h-3 w-3" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs rounded px-2 py-1">
                    <Badge variant="success" className="text-xs font-bold">
                      Available
                    </Badge>
                    <span className="font-bold">{availableCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs rounded px-2 py-1">
                    <div className="flex flex-col">
                      <Badge variant="assigned" className="text-xs font-bold">
                        On Job
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">(inventory not available)</span>
                    </div>
                    <span className="font-bold">{onJobCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs rounded px-2 py-1">
                    <div className="flex flex-col">
                      <Badge variant="warning" className="text-xs font-bold">
                        Maintenance
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">(inventory not available)</span>
                    </div>
                    <span className="font-bold">{inMaintenanceCount}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
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