import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { Droplets, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ConsumablesAlertCard: React.FC = () => {
  const { hasAdminAccess } = useUserRole();
  const navigate = useNavigate();

  const { data: totalStats, isLoading } = useQuery({
    queryKey: ['dashboard-consumable-location-stats'],
    queryFn: async () => {
      // Get all location stock entries with their low stock thresholds
      const { data: locationStockData, error } = await supabase
        .from('consumable_location_stock')
        .select(`
          id,
          quantity,
          low_stock_threshold,
          consumable:consumables!inner(
            id,
            name,
            is_active
          )
        `);
      
      if (error) throw error;
      
      // Filter for active consumables only
      const activeLocationStocks = locationStockData.filter(
        (stock: any) => stock.consumable?.is_active === true
      );
      
      // Count low stock locations (where location has a threshold set and quantity is below it)
      const lowStockLocations = activeLocationStocks.filter((stock: any) => 
        stock.low_stock_threshold && 
        stock.low_stock_threshold > 0 && 
        stock.quantity <= stock.low_stock_threshold
      ).length;
      
      // Get unique consumable count
      const uniqueConsumableIds = new Set(
        activeLocationStocks.map((stock: any) => stock.consumable?.id)
      );
      
      return { 
        lowStockCount: lowStockLocations, 
        totalItems: uniqueConsumableIds.size,
        totalLocationStocks: activeLocationStocks.length 
      };
    },
    enabled: hasAdminAccess
  });

  // Don't show widget for non-admin users
  if (!hasAdminAccess) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stockedPercentage = totalStats && totalStats.totalItems > 0 
    ? ((totalStats.totalItems - totalStats.lowStockCount) / totalStats.totalItems * 100)
    : 100;

  return (
    <Card className="w-full">
      <CardContent className="py-6">
        <div className="flex items-center justify-between">
          {/* Left Section - Icon and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Droplets className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Consumables Alert</h3>
              <p className="text-sm text-gray-500">
                {stockedPercentage.toFixed(0)}% of items are properly stocked
              </p>
            </div>
          </div>

          {/* Center Section - Stats */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {totalStats?.lowStockCount || 0}
              </div>
              <div className="text-sm text-gray-600">Low Stock Locations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {totalStats?.totalItems || 0}
              </div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </div>

          {/* Right Section - Action Button */}
          <div className="flex items-center gap-3">
            {totalStats && totalStats.lowStockCount > 0 && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-sm px-3 py-1">
                {totalStats.lowStockCount} LOW
              </Badge>
            )}
            <Button 
              onClick={() => navigate('/consumables')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Inventory
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};