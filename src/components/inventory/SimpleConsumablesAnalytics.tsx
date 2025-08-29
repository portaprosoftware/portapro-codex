import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { Package, AlertTriangle, DollarSign, Calculator, TrendingUp, ChevronDown, ChevronRight, Info, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

interface SimpleConsumablesAnalyticsProps {
  searchTerm?: string;
  categoryFilter?: string;
  onViewConsumable?: (consumable: Consumable) => void;
}

export const SimpleConsumablesAnalytics: React.FC<SimpleConsumablesAnalyticsProps> = ({
  searchTerm = '',
  categoryFilter = '',
  onViewConsumable
}) => {
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
      'Cost Per Unit',
      'Price Per Unit',
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
        `$${consumable.unit_cost.toFixed(2)}`,
        `$${consumable.unit_price.toFixed(2)}`,
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

  // Filter consumables based on search term and category
  const filteredConsumables = consumables?.filter(consumable => {
    const matchesSearch = !searchTerm.trim() || 
      consumable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      consumable.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || consumable.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Use filtered consumables for calculations
  const totalItems = filteredConsumables.length;
  const lowStockItems = filteredConsumables.filter(c => c.on_hand_qty <= c.reorder_threshold).length;
  const outOfStockItems = filteredConsumables.filter(c => c.on_hand_qty <= 0).length;
  const totalValue = filteredConsumables.reduce((sum, c) => sum + (c.on_hand_qty * c.unit_cost), 0);

  return (
    <div className="space-y-6">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div style={{ background: 'linear-gradient(135deg, hsl(210, 15%, 94%), hsl(210, 15%, 98%))' }} className="rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Items</p>
              <p className="text-2xl font-bold text-foreground">{totalItems}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white stroke-2" />
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, hsl(210, 15%, 94%), hsl(210, 15%, 98%))' }} className="rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Inventory Value</p>
              <p className="text-2xl font-bold text-foreground">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white stroke-2" />
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, hsl(210, 15%, 94%), hsl(210, 15%, 98%))' }} className="rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-foreground">{lowStockItems}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white stroke-2" />
            </div>
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, hsl(210, 15%, 94%), hsl(210, 15%, 98%))' }} className="rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Out of Stock</p>
              <p className="text-2xl font-bold text-foreground">{outOfStockItems}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white stroke-2" />
            </div>
          </div>
        </div>
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
                   <TableHead>Daily Usage
                     <Popover>
                       <PopoverTrigger asChild>
                         <button 
                           onClick={(e) => e.stopPropagation()}
                           className="ml-1 p-0.5 hover:bg-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 inline-flex"
                         >
                           <Info className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                         </button>
                       </PopoverTrigger>
                       <PopoverContent className="w-80 p-4 bg-white border shadow-lg z-50" side="bottom" align="start">
                         <div className="space-y-3">
                           <h4 className="font-semibold text-sm">How Daily Usage Works</h4>
                           <p className="text-sm text-gray-700">
                             Shows the average amount consumed per day based on available data.
                           </p>
                           <div className="space-y-2 text-sm">
                             <div className="flex items-start gap-2">
                               <span className="font-medium text-green-600">(R)</span>
                               <span>Real data from actual consumption history (ADU 30/90/7 day averages)</span>
                             </div>
                             <div className="flex items-start gap-2">
                               <span className="font-medium text-blue-600">(E)</span>
                               <span>Estimated based on on-hand quantity ÷ target days supply</span>
                             </div>
                           </div>
                           <div className="pt-2 border-t border-gray-200">
                             <p className="text-xs text-gray-600">
                               <strong>Priority:</strong> ADU 30 → ADU 90 → ADU 7 → Estimated calculation
                             </p>
                           </div>
                         </div>
                       </PopoverContent>
                     </Popover>
                   </TableHead>
                   <TableHead>Cost/Price Per Unit</TableHead>
                   <TableHead>Value</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsumables.map((consumable) => {
                  const analytics = getConsumableAnalytics(consumable);
                  return (
                    <TableRow key={consumable.id}>
                       <TableCell className="font-medium">
                         <button
                           onClick={() => onViewConsumable?.(consumable)}
                           className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                         >
                           {consumable.name}
                         </button>
                       </TableCell>
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
                             className={`text-xs ${analytics.hasRealData ? 'text-green-600 border-green-200' : 'text-blue-600 border-blue-200'}`}
                           >
                             {analytics.hasRealData ? 'R' : 'E'}
                           </Badge>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="space-y-1 text-xs">
                           <div>Cost: ${consumable.unit_cost.toFixed(2)}</div>
                           <div>Price: ${consumable.unit_price.toFixed(2)}</div>
                         </div>
                       </TableCell>
                       <TableCell>${analytics.inventoryValue.toFixed(2)}</TableCell>
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