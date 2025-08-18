import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { toast } from 'sonner';

interface Consumable {
  id: string;
  name: string;
  category: string;
  unit_cost: number;
  unit_price: number;
  on_hand_qty: number;
  reorder_threshold: number;
  target_days_supply: number;
  lead_time_days: number;
  base_unit: string;
}

interface VelocityStats {
  consumable_id: string;
  adu_30?: number;
  adu_90?: number;
  adu_7?: number;
}

export const SimpleConsumablesAnalytics: React.FC = () => {
  // Fetch consumables data
  const { data: consumables, isLoading } = useQuery({
    queryKey: ['simple-consumables-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('id, name, category, unit_cost, unit_price, on_hand_qty, reorder_threshold, target_days_supply, lead_time_days, base_unit')
        .order('name');
      
      if (error) throw error;
      return data as Consumable[];
    }
  });

  // Fetch velocity stats for real usage data
  const { data: velocityStats } = useQuery({
    queryKey: ['consumable-velocity-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumable_velocity_stats')
        .select('consumable_id, adu_30, adu_90, adu_7');
      
      if (error) throw error;
      return data as VelocityStats[];
    }
  });

  // Calculate analytics for each consumable using real data when available
  const getConsumableAnalytics = (consumable: Consumable) => {
    // Get velocity stats for this consumable
    const velocity = velocityStats?.find(v => v.consumable_id === consumable.id);
    
    // Use real usage data if available, fallback to estimated
    const dailyUsage = velocity?.adu_30 || velocity?.adu_90 || velocity?.adu_7 || 
                      (consumable.on_hand_qty / (consumable.target_days_supply || 14));
    
    const hasRealData = !!(velocity?.adu_30 || velocity?.adu_90 || velocity?.adu_7);
    
    const daysSupply = dailyUsage > 0 ? Math.round(consumable.on_hand_qty / dailyUsage) : 0;
    
    // Safety stock of 3 days to match the modal hook
    const safetyStockDays = 3;
    const reorderPoint = Math.ceil(dailyUsage * (consumable.lead_time_days + safetyStockDays));
    
    const inventoryValue = consumable.on_hand_qty * consumable.unit_cost;
    
    const stockStatus = consumable.on_hand_qty <= 0 ? 'Out of Stock' 
      : consumable.on_hand_qty <= consumable.reorder_threshold ? 'Low Stock' 
      : 'In Stock';

    return {
      daysSupply,
      reorderPoint,
      dailyUsage,
      inventoryValue,
      stockStatus,
      hasRealData
    };
  };

  // Export analytics data
  const handleExport = () => {
    if (!consumables) return;

    const csvHeaders = [
      'Name',
      'Category', 
      'On Hand',
      'Days Supply',
      'Lead Time (Days)',
      'Reorder Point',
      'Daily Usage Rate',
      'Data Type',
      'Inventory Value',
      'Stock Status'
    ];

    const csvData = consumables.map(consumable => {
      const analytics = getConsumableAnalytics(consumable);
      return [
        consumable.name,
        formatCategoryDisplay(consumable.category),
        consumable.on_hand_qty,
        analytics.daysSupply,
        consumable.lead_time_days,
        analytics.reorderPoint,
        analytics.dailyUsage.toFixed(2),
        analytics.hasRealData ? 'Real' : 'Est.',
        `$${analytics.inventoryValue.toFixed(2)}`,
        analytics.stockStatus
      ];
    });

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consumables-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!consumables || consumables.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">No consumables available for analytics</div>
        <p className="text-sm text-gray-400">Add consumables to see their inventory metrics</p>
      </div>
    );
  }

  // Calculate summary metrics
  const totalItems = consumables.length;
  const lowStockItems = consumables.filter(c => c.on_hand_qty <= c.reorder_threshold).length;
  const outOfStockItems = consumables.filter(c => c.on_hand_qty <= 0).length;
  const totalValue = consumables.reduce((sum, c) => sum + (c.on_hand_qty * c.unit_cost), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Consumables Analytics
            </CardTitle>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>On Hand</TableHead>
                  <TableHead>Days Supply</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead>Daily Usage</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumables.map((consumable) => {
                  const analytics = getConsumableAnalytics(consumable);
                  return (
                    <TableRow key={consumable.id}>
                      <TableCell className="font-medium">{consumable.name}</TableCell>
                      <TableCell>{formatCategoryDisplay(consumable.category)}</TableCell>
                      <TableCell>{consumable.on_hand_qty}</TableCell>
                      <TableCell>{analytics.daysSupply} days</TableCell>
                      <TableCell>{consumable.lead_time_days} days</TableCell>
                      <TableCell>{analytics.reorderPoint}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {analytics.dailyUsage.toFixed(2)}/{consumable.base_unit}
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {analytics.hasRealData ? 'Real' : 'Est.'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>${analytics.inventoryValue.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            analytics.stockStatus === 'Out of Stock' 
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0'
                              : analytics.stockStatus === 'Low Stock'
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0'
                              : 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0'
                          }
                        >
                          {analytics.stockStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};