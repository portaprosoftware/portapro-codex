import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, Clock, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type InventoryItem = {
  id: string;
  item_name: string;
  item_type: string;
  unit_cost: number;
  current_stock: number;
  minimum_threshold: number;
  reorder_quantity: number;
  is_critical?: boolean;
  expiration_date?: string;
  usage_count?: number;
};

export function SpillKitInventoryDashboard() {
  const { data: inventoryItems } = useQuery({
    queryKey: ['spill-kit-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_kit_inventory')
        .select('*')
        .order('item_name');
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  // Calculate dashboard metrics
  const totalItems = inventoryItems?.length || 0;
  const lowStockItems = inventoryItems?.filter(item => item.current_stock <= item.minimum_threshold) || [];
  const outOfStockItems = inventoryItems?.filter(item => item.current_stock === 0) || [];
  const criticalLowStock = inventoryItems?.filter(item => item.is_critical && item.current_stock <= item.minimum_threshold) || [];
  
  const totalValue = inventoryItems?.reduce((sum, item) => sum + (item.unit_cost * item.current_stock), 0) || 0;
  
  const expiringItems = inventoryItems?.filter(item => {
    if (!item.expiration_date) return false;
    const expiryDate = new Date(item.expiration_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  }) || [];

  const expiredItems = inventoryItems?.filter(item => {
    if (!item.expiration_date) return false;
    return new Date(item.expiration_date) < new Date();
  }) || [];

  // Calculate restock cost
  const restockCost = lowStockItems.reduce((sum, item) => {
    const qtyNeeded = item.reorder_quantity;
    return sum + (item.unit_cost * qtyNeeded);
  }, 0);

  // Category breakdown
  const categoryData = inventoryItems?.reduce((acc, item) => {
    const type = item.item_type || 'other';
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0 };
    }
    acc[type].count += item.current_stock;
    acc[type].value += item.unit_cost * item.current_stock;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const getCategoryLabel = (type: string) => {
    const labels: Record<string, string> = {
      'absorbent': 'Absorbents',
      'containment': 'Containment',
      'ppe': 'PPE',
      'decon': 'Decon & Cleaning',
      'tools': 'Tools',
      'disposal': 'Disposal',
      'documentation': 'Documentation',
      'pump_transfer': 'Pump/Transfer',
      'signage': 'Signage',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (item: InventoryItem) => {
    // Check expired first
    if (item.expiration_date && new Date(item.expiration_date) < new Date()) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-orange-500 to-red-600">⚠️ Expired</Badge>;
    }
    
    // Check critical missing
    if (item.is_critical && item.current_stock === 0) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-700 animate-pulse">🚨 Critical Missing</Badge>;
    }
    
    // Check out of stock
    if (item.current_stock === 0) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600">🔴 Out of Stock</Badge>;
    }
    
    // Check low stock
    if (item.current_stock <= item.minimum_threshold) {
      return <Badge variant="outline" className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black border-yellow-600">🟡 Low Stock</Badge>;
    }
    
    // In stock
    return <Badge variant="outline" className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-600">🟢 In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique SKUs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalLowStock.length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{expiringItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {expiredItems.length} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Current stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restock Cost</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">${restockCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{lowStockItems.length} items</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData && Object.entries(categoryData).map(([type, data]) => {
              const percentage = (data.value / totalValue) * 100;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{getCategoryLabel(type)}</span>
                    <span className="text-muted-foreground">
                      {data.count} units • ${data.value.toFixed(2)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {(criticalLowStock.length > 0 || expiredItems.length > 0 || outOfStockItems.length > 0) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Immediate Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalLowStock.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Critical Items Low/Out of Stock:</h4>
                <div className="space-y-2">
                  {criticalLowStock.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                      <span className="font-medium">{item.item_name}</span>
                      {getStatusBadge(item)}
                      <span className="text-sm">Stock: {item.current_stock}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expiredItems.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Expired Items:</h4>
                <div className="space-y-2">
                  {expiredItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/20 rounded">
                      <span className="font-medium">{item.item_name}</span>
                      {getStatusBadge(item)}
                      <span className="text-sm">Expired: {new Date(item.expiration_date!).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Restock Recommendations */}
      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Suggested Restock Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map(item => {
                const qtyNeeded = item.reorder_quantity;
                const itemCost = item.unit_cost * qtyNeeded;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Current: {item.current_stock} | Min: {item.minimum_threshold}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">Order {qtyNeeded} units</div>
                      <div className="text-sm text-muted-foreground">${itemCost.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Restock Cost:</span>
                  <span className="text-primary">${restockCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
