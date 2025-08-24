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

export const InventoryMaintenanceOverview: React.FC = () => {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Inventory Maintenance</h2>
        <p className="text-muted-foreground">
          Manage and track maintenance across your entire inventory
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total in Maintenance</p>
                <p className="text-2xl font-bold">{maintenanceStats?.total || 0}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{maintenanceStats?.overdue || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due This Week</p>
                <p className="text-2xl font-bold text-yellow-600">{maintenanceStats?.dueThisWeek || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Priority</p>
                <p className="text-2xl font-bold text-red-600">{maintenanceStats?.critical || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance by Product Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Maintenance by Product Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maintenanceByProduct?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">{item.product}</span>
                <Badge variant="outline">{item.count} units</Badge>
              </div>
            ))}
            {(!maintenanceByProduct || maintenanceByProduct.length === 0) && (
              <p className="text-muted-foreground col-span-full text-center py-4">
                No items currently in maintenance
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Views */}
      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracker">Maintenance Tracker</TabsTrigger>
          <TabsTrigger value="schedule">Scheduled Maintenance</TabsTrigger>
          <TabsTrigger value="history">Maintenance History</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <MaintenanceTrackerTab productId="all" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Scheduled maintenance feature coming soon</p>
                <p className="text-sm">Track preventive maintenance schedules and reminders</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Maintenance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Maintenance history feature coming soon</p>
                <p className="text-sm">View completed maintenance records and trends</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};