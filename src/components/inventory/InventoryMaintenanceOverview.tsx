import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Search, 
  Filter,
  Calendar,
  MapPin,
  Settings
} from "lucide-react";
import { MaintenanceTrackerTab } from "./MaintenanceTrackerTab";
import { MaintenanceHistorySection } from "./MaintenanceHistorySection";
import { cn } from "@/lib/utils";

export const InventoryMaintenanceOverview: React.FC = () => {
  const [activeMode, setActiveMode] = useState<"tracker" | "history">("tracker");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch maintenance statistics
  const { data: maintenanceStats } = useQuery({
    queryKey: ["maintenance-stats"],
    queryFn: async () => {
      const { data: allMaintenance, error } = await supabase
        .from("product_items")
        .select("id, maintenance_priority, maintenance_reason, expected_return_date, maintenance_start_date, products(name)")
        .eq("status", "maintenance");

      if (error) throw error;

      const now = new Date();
      const overdue = allMaintenance?.filter(item => 
        item.expected_return_date && new Date(item.expected_return_date) < now
      ).length || 0;

      const dueThisWeek = allMaintenance?.filter(item => {
        if (!item.expected_return_date) return false;
        const dueDate = new Date(item.expected_return_date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return dueDate >= now && dueDate <= weekFromNow;
      }).length || 0;

      const critical = allMaintenance?.filter(item => 
        item.maintenance_priority === "critical"
      ).length || 0;

      const high = allMaintenance?.filter(item => 
        item.maintenance_priority === "high"
      ).length || 0;

      return {
        total: allMaintenance?.length || 0,
        overdue,
        dueThisWeek,
        critical,
        high,
        items: allMaintenance || []
      };
    }
  });

  // Fetch maintenance by product type
  const { data: maintenanceByProduct } = useQuery({
    queryKey: ["maintenance-by-product"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_items")
        .select("id, products(id, name)")
        .eq("status", "maintenance");

      if (error) throw error;

      const productCounts = data?.reduce((acc, item) => {
        const productName = item.products?.name || "Unknown";
        acc[productName] = (acc[productName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return Object.entries(productCounts).map(([name, count]) => ({
        product: name,
        count
      }));
    }
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Inventory Maintenance</h2>
        <p className="text-muted-foreground text-sm">
          Manage and track maintenance across your entire inventory
        </p>
      </div>

      {/* Tabbed Views */}
      <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as "tracker" | "history")} className="w-full">
        {/* Desktop: TabsList with pills */}
        <TabsList className="hidden lg:grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="tracker">Maintenance Tracker</TabsTrigger>
          <TabsTrigger value="history">Maintenance History</TabsTrigger>
        </TabsList>

        {/* Mobile: Select dropdown */}
        <div className="lg:hidden mb-4">
          <Select value={activeMode} onValueChange={(v) => setActiveMode(v as "tracker" | "history")}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue>
                {activeMode === "tracker" ? "Maintenance Tracker" : "Maintenance History"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tracker">Maintenance Tracker</SelectItem>
              <SelectItem value="history">Maintenance History</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="tracker" className="space-y-4 mt-0">
          <Card>
            <CardContent className="p-4 md:p-6">
              <MaintenanceTrackerTab productId="all" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-0">
          <MaintenanceHistorySection productId="all" />
        </TabsContent>
      </Tabs>
    </div>
  );
};