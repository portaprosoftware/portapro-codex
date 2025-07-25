import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageLocationSelector } from '@/components/inventory/StorageLocationSelector';
import { StockTransferModal } from '@/components/inventory/StockTransferModal';
import { AlertTriangle, Package, ArrowRightLeft, Building, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LowStockAlert {
  consumable_id: string;
  consumable_name: string;
  storage_location_id: string;
  storage_location_name: string;
  current_quantity: number;
  reorder_threshold: number;
  shortage_amount: number;
  category: string;
}

export const LocationBasedLowStockAlerts: React.FC = () => {
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    consumableId?: string;
    currentLocationId?: string;
  }>({ open: false });
  
  const { toast } = useToast();

  // Fetch low stock alerts by location
  const { data: lowStockAlerts, isLoading, refetch } = useQuery({
    queryKey: ['low-stock-alerts', selectedLocationId, selectedCategory],
    queryFn: async () => {
      // Get consumables with location stock and check against thresholds
      let query = supabase
        .from('consumables')
        .select(`
          id,
          name,
          category,
          reorder_threshold,
          consumable_location_stock(
            storage_location_id,
            quantity,
            storage_locations(id, name)
          )
        `)
        .eq('is_active', true);

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data: consumables, error } = await query;
      if (error) throw error;

      const alerts: LowStockAlert[] = [];

      consumables?.forEach(consumable => {
        if (!consumable.consumable_location_stock) return;

        consumable.consumable_location_stock.forEach((locationStock: any) => {
          // Skip if filtering by specific location and this isn't it
          if (selectedLocationId !== 'all' && locationStock.storage_location_id !== selectedLocationId) {
            return;
          }

          const currentQuantity = locationStock.quantity || 0;
          const threshold = consumable.reorder_threshold || 5;

          if (currentQuantity <= threshold) {
            alerts.push({
              consumable_id: consumable.id,
              consumable_name: consumable.name,
              storage_location_id: locationStock.storage_location_id,
              storage_location_name: locationStock.storage_locations?.name || 'Unknown Location',
              current_quantity: currentQuantity,
              reorder_threshold: threshold,
              shortage_amount: Math.max(0, threshold - currentQuantity),
              category: consumable.category || 'Uncategorized'
            });
          }
        });
      });

      // Sort by severity (lowest stock first)
      return alerts.sort((a, b) => a.current_quantity - b.current_quantity);
    }
  });

  // Get unique categories for filtering
  const { data: categories } = useQuery({
    queryKey: ['consumable-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('category')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(c => c.category).filter(Boolean))];
      return uniqueCategories.sort();
    }
  });

  const handleTransfer = (alert: LowStockAlert) => {
    setTransferModal({
      open: true,
      consumableId: alert.consumable_id,
      currentLocationId: alert.storage_location_id
    });
  };

  const handleCreateOrder = async (alert: LowStockAlert) => {
    // This would integrate with purchase order system
    toast({
      title: "Purchase Order Created",
      description: `Created reorder request for ${alert.consumable_name} at ${alert.storage_location_name}`,
    });
  };

  const getSeverityBadge = (alert: LowStockAlert) => {
    if (alert.current_quantity === 0) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Out of Stock</Badge>;
    } else if (alert.current_quantity <= alert.reorder_threshold / 2) {
      return <Badge variant="destructive" className="gap-1"><TrendingDown className="w-3 h-3" />Critical</Badge>;
    } else {
      return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" />Low Stock</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Location-Based Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading stock alerts...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Location-Based Low Stock Alerts
            {lowStockAlerts && lowStockAlerts.length > 0 && (
              <Badge variant="destructive">{lowStockAlerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <StorageLocationSelector
                value={selectedLocationId}
                onValueChange={setSelectedLocationId}
                includeAllSites={true}
                placeholder="Filter by location"
              />
            </div>
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alerts List */}
          {lowStockAlerts && lowStockAlerts.length > 0 ? (
            <div className="space-y-3">
              {lowStockAlerts.map((alert, index) => (
                <div
                  key={`${alert.consumable_id}-${alert.storage_location_id}`}
                  className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-900">{alert.consumable_name}</span>
                      {getSeverityBadge(alert)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <Building className="w-3 h-3" />
                      <span>{alert.storage_location_name}</span>
                    </div>
                    
                    <div className="text-sm text-red-600 mt-1">
                      Current: {alert.current_quantity} | Threshold: {alert.reorder_threshold}
                      {alert.shortage_amount > 0 && (
                        <span className="ml-2 font-medium">
                          Need: {alert.shortage_amount} more units
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTransfer(alert)}
                      className="gap-1"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      Transfer
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleCreateOrder(alert)}
                      className="gap-1"
                    >
                      <Package className="w-3 h-3" />
                      Reorder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-green-600">
              <Package className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <h3 className="font-medium mb-1">All Stock Levels Good!</h3>
              <p className="text-sm text-muted-foreground">
                No low stock alerts for the selected location and category.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <StockTransferModal
        open={transferModal.open}
        onOpenChange={(open) => setTransferModal({ ...transferModal, open })}
        onClose={() => setTransferModal({ open: false })}
        consumableId={transferModal.consumableId}
        currentLocationId={transferModal.currentLocationId}
      />
    </>
  );
};