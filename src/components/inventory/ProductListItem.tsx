import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, ChevronDown, ChevronUp, BarChart3, MapPin, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedStockManagement } from "@/hooks/useUnifiedStockManagement";

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

interface ProductListItemProps {
  product: Product;
  onSelect: () => void;
}

interface LocationStock {
  id: string;
  quantity: number;
  product_id: string;
  storage_location_id: string;
  storage_location: {
    id: string;
    name: string;
  };
}

interface QuickStats {
  activeAssignments: number;
  completedAssignments: number;
  totalItems: number;
  utilizationRate: number;
  recentActivity: number;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({ product, onSelect }) => {
  const queryClient = useQueryClient();
  const [showLocationBreakdown, setShowLocationBreakdown] = useState(false);
  const [showEquipmentBreakdown, setShowEquipmentBreakdown] = useState(false);

  // Use unified stock management for accurate calculations
  const { stockData, calculations, isLoading: isStockLoading } = useUnifiedStockManagement(product.id);
  
  const availableCount = stockData?.totals?.physically_available || 0;
  const inMaintenanceCount = stockData?.individual_items?.maintenance || 0;
  const onJobCount = stockData?.individual_items?.assigned || 0;
  
  
  // Badge logic removed - will be replaced with unified badge system

  // Real-time subscription for inventory updates
  useEffect(() => {
    const subscription = supabase
      .channel(`product_${product.id}_items`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'product_items',
          filter: `product_id=eq.${product.id}`
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['product-stats', product.id] });
          queryClient.invalidateQueries({ queryKey: ['location-stocks', product.id] });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [product.id, queryClient]);

  // Fetch location stocks
  const { data: locationStocks, isLoading: isLoadingStocks } = useQuery({
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

  // Fetch quick stats
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

  // Badge function removed - will be replaced with unified badge system

  const hasLocations = locationStocks && locationStocks.length > 0;

  return (
    <div className="bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Main row */}
      <div className="flex items-center p-4">
        {/* Product Image */}
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mr-4">
          {product.base_image ? (
            <img
              src={product.base_image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <Badge variant="success" className="text-xs px-2 py-1">
              {availableCount}
            </Badge>
          </div>
          <p className="text-blue-600 font-medium">${product.default_price_per_day}/day</p>
        </div>

        {/* Status badge removed - will be replaced with unified badge system */}

        {/* Quick Stats */}
        {quickStats && (
          <div className="mr-2">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64" side="top">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Quick Statistics</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Total Stock:</span>
                      <span className="ml-1 font-medium">{product.stock_total}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Available:</span>
                      <span className="ml-1 font-medium">{availableCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">In Service:</span>
                      <span className="ml-1 font-medium">{product.stock_in_service}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Utilization:</span>
                      <span className="ml-1 font-medium text-purple-600">{quickStats.utilizationRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Active Assignments:</span>
                      <span className="ml-1 font-medium">{quickStats.activeAssignments}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Recent Activity (30d):</span>
                      <span className="ml-1 font-medium">{quickStats.recentActivity}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Storage Sites:</span>
                      <span className="ml-1 font-medium">{locationStocks?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tracked Units:</span>
                      <span className="ml-1 font-medium">{quickStats.totalItems}</span>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        )}

        {/* Breakdown triggers */}
        <div className="mr-2 flex gap-1">
          {hasLocations && (
            <Collapsible open={showLocationBreakdown} onOpenChange={setShowLocationBreakdown}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  Location
                  {showLocationBreakdown ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
          
          <Collapsible open={showEquipmentBreakdown} onOpenChange={setShowEquipmentBreakdown}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Status
                {showEquipmentBreakdown ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Action */}
        <Button
          onClick={onSelect}
          variant="outline"
          size="sm"
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      </div>

      {/* Breakdown sections */}
      <Collapsible open={showLocationBreakdown || showEquipmentBreakdown} onOpenChange={() => {}}>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-gray-100">
            
            {/* Location breakdown */}
            {showLocationBreakdown && hasLocations && (
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Stock by Site
                </h4>
                {isLoadingStocks ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locationStocks?.map((location) => (
                      <div key={location.storage_location_id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{location.storage_location?.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{location.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Equipment status breakdown */}
            {showEquipmentBreakdown && (
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Settings className="w-4 h-4 mr-1" />
                  Equipment Status
                </h4>
                <div className="space-y-2">
                  {availableCount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Available
                      </span>
                      <span className="font-medium">{availableCount}</span>
                    </div>
                  )}
                  {onJobCount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        On Job
                      </span>
                      <span className="font-medium">{onJobCount}</span>
                    </div>
                  )}
                  {inMaintenanceCount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Maintenance
                      </span>
                      <span className="font-medium">{inMaintenanceCount}</span>
                    </div>
                  )}
                  {availableCount === 0 && onJobCount === 0 && inMaintenanceCount === 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      No equipment data
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};