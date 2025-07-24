import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserRole } from '@/hooks/useUserRole';
import { AlertTriangle, Package, ShoppingCart, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LowStockWidget: React.FC = () => {
  const { hasAdminAccess } = useUserRole();
  const navigate = useNavigate();

  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('*')
        .filter('on_hand_qty', 'lt', 'reorder_threshold')
        .eq('is_active', true)
        .order('on_hand_qty', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: hasAdminAccess // Only load for admin users
  });

  const { data: totalStats } = useQuery({
    queryKey: ['dashboard-consumable-stats'],
    queryFn: async () => {
      const [lowStockResult, totalResult] = await Promise.all([
        supabase
          .from('consumables')
          .select('id', { count: 'exact' })
          .filter('on_hand_qty', 'lt', 'reorder_threshold')
          .eq('is_active', true),
        supabase
          .from('consumables')
          .select('id', { count: 'exact' })
          .eq('is_active', true)
      ]);

      return {
        lowStockCount: lowStockResult.count || 0,
        totalItems: totalResult.count || 0
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const urgentItems = lowStockItems?.filter(item => item.on_hand_qty === 0) || [];
  const criticalItems = lowStockItems?.filter(item => item.on_hand_qty > 0 && item.on_hand_qty < item.reorder_threshold * 0.5) || [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Consumables Alert
          </div>
          {totalStats && totalStats.lowStockCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalStats.lowStockCount} LOW
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded">
            <p className="text-2xl font-bold text-orange-600">
              {totalStats?.lowStockCount || 0}
            </p>
            <p className="text-xs text-muted-foreground">Need Reorder</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded">
            <p className="text-2xl font-bold">
              {totalStats?.totalItems || 0}
            </p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </div>
        </div>

        {/* Alerts */}
        {urgentItems.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <strong>{urgentItems.length} items</strong> are completely out of stock!
            </AlertDescription>
          </Alert>
        )}

        {/* Low Stock Items List */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {lowStockItems?.length === 0 ? (
            <div className="text-center py-4">
              <Package className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-sm text-green-600 font-medium">All items in stock!</p>
              <p className="text-xs text-muted-foreground">No reorders needed</p>
            </div>
          ) : (
            lowStockItems?.map((item) => {
              const isUrgent = item.on_hand_qty === 0;
              const isCritical = item.on_hand_qty > 0 && item.on_hand_qty < item.reorder_threshold * 0.5;
              
              return (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    isUrgent ? 'bg-red-50 border border-red-200' :
                    isCritical ? 'bg-orange-50 border border-orange-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.on_hand_qty} / {item.reorder_threshold}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={isUrgent ? 'destructive' : isCritical ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {isUrgent ? 'OUT' : 'LOW'}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t space-y-2">
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => navigate('/consumables')}
          >
            <ExternalLink className="w-3 h-3 mr-2" />
            View Inventory
          </Button>
          
          {totalStats && totalStats.lowStockCount > 0 && (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/purchase-orders')}
            >
              <ShoppingCart className="w-3 h-3 mr-2" />
              Create Purchase Order
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {totalStats && (
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {((totalStats.totalItems - totalStats.lowStockCount) / totalStats.totalItems * 100).toFixed(0)}% 
              of items are properly stocked
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};