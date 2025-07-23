
import React from "react";
import { Package, TrendingUp, AlertTriangle, Clock, DollarSign, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InventoryMetrics {
  totalItems: number;
  availableItems: number;
  assignedItems: number;
  maintenanceItems: number;
  lowStockCount: number;
  utilizationRate: number;
  totalValue: number;
  recentAdjustments: number;
}

export const InventoryDashboard: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["inventory-metrics"],
    queryFn: async (): Promise<InventoryMetrics> => {
      // Get total products and stock
      const { data: products } = await supabase
        .from("products")
        .select("stock_total, stock_in_service, price, low_stock_threshold");

      // Get individual items
      const { data: items } = await supabase
        .from("product_items")
        .select("status");

      // Get recent adjustments (last 7 days)
      const { data: adjustments } = await supabase
        .from("stock_adjustments")
        .select("id")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!products || !items) {
        throw new Error("Failed to fetch inventory data");
      }

      const totalItems = products.reduce((sum, p) => sum + p.stock_total, 0);
      const assignedItems = products.reduce((sum, p) => sum + p.stock_in_service, 0);
      const availableItems = totalItems - assignedItems;
      
      const maintenanceItems = items.filter(item => item.status === "maintenance").length;
      const lowStockCount = products.filter(p => 
        (p.stock_total - p.stock_in_service) <= p.low_stock_threshold
      ).length;
      
      const utilizationRate = totalItems > 0 ? (assignedItems / totalItems) * 100 : 0;
      const totalValue = products.reduce((sum, p) => sum + (p.stock_total * (p.price || 0)), 0);

      return {
        totalItems,
        availableItems,
        assignedItems,
        maintenanceItems,
        lowStockCount,
        utilizationRate,
        totalValue,
        recentAdjustments: adjustments?.length || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load inventory metrics</p>
      </div>
    );
  }

  const getUtilizationColor = (rate: number) => {
    if (rate > 80) return "text-red-600";
    if (rate > 60) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalItems}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-green-600">{metrics.availableItems} available</span>
            <span className="text-blue-600">{metrics.assignedItems} assigned</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getUtilizationColor(metrics.utilizationRate)}`}>
            {metrics.utilizationRate.toFixed(1)}%
          </div>
          <Progress value={metrics.utilizationRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{metrics.lowStockCount}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.lowStockCount === 0 ? "All items well stocked" : "Items need attention"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maintenance Required</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{metrics.maintenanceItems}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.maintenanceItems === 0 ? "No maintenance needed" : "Items in service"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${metrics.totalValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Current inventory value</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.recentAdjustments}</div>
          <p className="text-xs text-muted-foreground">
            Stock adjustments (last 7 days)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
