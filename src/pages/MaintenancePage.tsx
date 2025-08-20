import React, { useState, useEffect } from "react";
import { Search, Wrench, DollarSign, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/ui/StatCard";
import { ProductMaintenanceGroup } from "@/components/maintenance/ProductMaintenanceGroup";

export default function MaintenancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);

  useEffect(() => {
    document.title = "Maintenance Overview | PortaPro";
  }, []);

  // Fetch maintenance statistics
  const { data: maintenanceStats } = useQuery({
    queryKey: ["maintenance-stats"],
    queryFn: async () => {
      // Get all items in maintenance
      const { data: maintenanceItems, error: maintenanceError } = await supabase
        .from("product_items")
        .select("id, maintenance_start_date, total_maintenance_cost, expected_return_date")
        .eq("status", "maintenance");

      if (maintenanceError) throw maintenanceError;

      // Calculate statistics
      const totalItems = maintenanceItems?.length || 0;
      const totalCost = maintenanceItems?.reduce((sum, item) => sum + (item.total_maintenance_cost || 0), 0) || 0;
      
      // Calculate overdue items
      const currentDate = new Date();
      const overdueItems = maintenanceItems?.filter(item => {
        if (!item.expected_return_date) return false;
        return new Date(item.expected_return_date) < currentDate;
      }).length || 0;

      // Calculate average days in maintenance
      const itemsWithStartDate = maintenanceItems?.filter(item => item.maintenance_start_date) || [];
      const avgDaysInMaintenance = itemsWithStartDate.length > 0 
        ? itemsWithStartDate.reduce((sum, item) => {
            const startDate = new Date(item.maintenance_start_date!);
            const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0) / itemsWithStartDate.length
        : 0;

      return {
        totalItems,
        totalCost,
        overdueItems,
        avgDaysInMaintenance: Math.round(avgDaysInMaintenance)
      };
    }
  });

  // Fetch products with maintenance items
  const { data: productsWithMaintenance, isLoading } = useQuery({
    queryKey: ["products-with-maintenance", searchQuery, selectedProduct, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          base_image,
          product_items!inner(
            id,
            item_code,
            status,
            maintenance_start_date,
            maintenance_reason,
            expected_return_date,
            maintenance_notes,
            total_maintenance_cost,
            current_storage_location_id,
            tool_number
          )
        `);

      // Filter by status (maintenance items only for now)
      if (statusFilter === "all" || statusFilter === "maintenance") {
        query = query.eq("product_items.status", "maintenance");
      }

      // Filter by specific product if selected
      if (selectedProduct !== "all") {
        query = query.eq("id", selectedProduct);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`
          name.ilike.%${searchQuery}%,
          product_items.item_code.ilike.%${searchQuery}%,
          product_items.maintenance_reason.ilike.%${searchQuery}%,
          product_items.maintenance_notes.ilike.%${searchQuery}%
        `);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;

      return data || [];
    }
  });

  // Fetch all products for filter dropdown
  const { data: allProducts } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data || [];
    }
  });

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const expandAll = () => {
    const allProductIds = productsWithMaintenance?.map(p => p.id) || [];
    setExpandedProducts(allProductIds);
  };

  const collapseAll = () => {
    setExpandedProducts([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Overview</h1>
            <p className="text-gray-600 mt-2">
              Monitor and manage maintenance across all products and units
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={collapseAll} size="sm">
              <ChevronUp className="w-4 h-4 mr-2" />
              Collapse All
            </Button>
            <Button variant="outline" onClick={expandAll} size="sm">
              <ChevronDown className="w-4 h-4 mr-2" />
              Expand All
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Items in Maintenance"
            value={maintenanceStats?.totalItems || 0}
            icon={Wrench}
            gradientFrom="#3b82f6"
            gradientTo="#1d4ed8"
            iconBg="#1e40af"
          />
          <StatCard
            title="Total Maintenance Cost"
            value={`$${(maintenanceStats?.totalCost || 0).toLocaleString()}`}
            icon={DollarSign}
            gradientFrom="#10b981"
            gradientTo="#059669"
            iconBg="#047857"
          />
          <StatCard
            title="Overdue Items"
            value={maintenanceStats?.overdueItems || 0}
            icon={AlertTriangle}
            gradientFrom="#ef4444"
            gradientTo="#dc2626"
            iconBg="#b91c1c"
          />
          <StatCard
            title="Avg Days in Maintenance"
            value={maintenanceStats?.avgDaysInMaintenance || 0}
            icon={Clock}
            gradientFrom="#8b5cf6"
            gradientTo="#7c3aed"
            iconBg="#6d28d9"
          />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search products, units, or maintenance notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {allProducts?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="maintenance">In Maintenance</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products with Maintenance Items */}
        <div className="space-y-4">
          {productsWithMaintenance && productsWithMaintenance.length > 0 ? (
            productsWithMaintenance.map((product) => (
              <ProductMaintenanceGroup
                key={product.id}
                product={product}
                isExpanded={expandedProducts.includes(product.id)}
                onToggleExpansion={() => toggleProductExpansion(product.id)}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No maintenance items found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || selectedProduct !== "all" 
                    ? "Try adjusting your filters to see more results."
                    : "All units are currently in service. Items in maintenance will appear here."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}