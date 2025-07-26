import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Settings, Bell, Package, Wrench, AlertTriangle, Clock, DollarSign } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { format } from "date-fns";
import { AddMaintenanceRecordModal } from "./AddMaintenanceRecordModal";
import { ScheduleRecurringServiceModal } from "./ScheduleRecurringServiceModal";
import { MaintenanceAllRecordsTab } from "./MaintenanceAllRecordsTab";
import { MaintenanceNotificationsTab } from "./MaintenanceNotificationsTab";
import { MaintenanceSettingsTab } from "./MaintenanceSettingsTab";
import { MaintenancePartsInventoryTab } from "./MaintenancePartsInventoryTab";
import { MaintenanceCalendarTab } from "./MaintenanceCalendarTab";

interface MaintenanceKPIs {
  past_due: number;
  due_this_week: number;
  in_progress: number;
  ytd_spend: number;
}

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: string;
  cost?: number;
  priority?: string;
  vehicles?: {
    license_plate: string;
    vehicle_type: string;
  };
  maintenance_task_types?: {
    name: string;
  };
  maintenance_vendors?: {
    name: string;
  };
}

interface CompanyMaintenanceSettings {
  enable_inhouse_features: boolean;
}

export const EnhancedMaintenanceManagement: React.FC = () => {
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [scheduleRecurringOpen, setScheduleRecurringOpen] = useState(false);

  // Fetch maintenance KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["maintenance-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_maintenance_kpis");
      if (error) throw error;
      return data as unknown as MaintenanceKPIs;
    }
  });

  // Fetch company settings to check if in-house features are enabled
  const { data: companySettings } = useQuery({
    queryKey: ["company-maintenance-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_maintenance_settings")
        .select("*")
        .single();
      if (error) throw error;
      return data as CompanyMaintenanceSettings;
    }
  });

  // Fetch overdue maintenance records for overview
  const { data: overdueRecords } = useQuery({
    queryKey: ["overdue-maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type),
          maintenance_task_types(name),
          maintenance_vendors(name)
        `)
        .lt("scheduled_date", new Date().toISOString().split('T')[0])
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as MaintenanceRecord[];
    }
  });

  // Fetch upcoming maintenance records for overview
  const { data: upcomingRecords } = useQuery({
    queryKey: ["upcoming-maintenance"],
    queryFn: async () => {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type),
          maintenance_task_types(name),
          maintenance_vendors(name)
        `)
        .gte("scheduled_date", today.toISOString().split('T')[0])
        .lte("scheduled_date", nextWeek.toISOString().split('T')[0])
        .eq("status", "scheduled")
        .order("scheduled_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as MaintenanceRecord[];
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const inHouseEnabled = companySettings?.enable_inhouse_features || false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">
              Fleet Maintenance
            </h1>
            <p className="text-base text-gray-600 font-inter mt-1">
              Track scheduled maintenance, manage vendors, and monitor vehicle health
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setScheduleRecurringOpen(true)}
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Recurring Service
            </Button>
            <Button
              onClick={() => setAddRecordOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Maintenance Record
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white rounded-full p-1 shadow-sm border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white rounded-full px-6 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="records" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white rounded-full px-6 py-2">
            All Records
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white rounded-full px-6 py-2">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white rounded-full px-6 py-2">
            Settings
          </TabsTrigger>
          {inHouseEnabled && (
            <>
              <TabsTrigger value="parts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white rounded-full px-6 py-2">
                Parts & Inventory
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-800 data-[state=active]:text-white rounded-full px-6 py-2">
                Calendar
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Past Due"
              value={kpis?.past_due || 0}
              icon={AlertTriangle}
              fromGradient="from-red-500"
              toGradient="to-red-600"
              animateValue={!kpisLoading}
            />
            <StatCard
              title="Due This Week"
              value={kpis?.due_this_week || 0}
              icon={Clock}
              fromGradient="from-orange-500"
              toGradient="to-orange-600"
              animateValue={!kpisLoading}
            />
            <StatCard
              title="In Progress"
              value={kpis?.in_progress || 0}
              icon={Wrench}
              fromGradient="from-blue-500"
              toGradient="to-blue-600"
              animateValue={!kpisLoading}
            />
            <StatCard
              title="YTD Maintenance Spend"
              value={`$${(kpis?.ytd_spend || 0).toLocaleString()}`}
              icon={DollarSign}
              fromGradient="from-green-500"
              toGradient="to-green-600"
              animateValue={!kpisLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Overdue Maintenance
                </CardTitle>
                <CardDescription>
                  Tasks that require immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overdueRecords && overdueRecords.length > 0 ? (
                  <div className="space-y-3">
                    {overdueRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(record.priority || "medium")} />
                            <span className="font-medium">{record.vehicles?.license_plate}</span>
                            <span className="text-sm text-gray-600">
                              {record.maintenance_task_types?.name || record.maintenance_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Due: {format(new Date(record.scheduled_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          View & Update
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No overdue maintenance tasks</p>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Schedule Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Upcoming This Week
                </CardTitle>
                <CardDescription>
                  Scheduled maintenance tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingRecords && upcomingRecords.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingRecords.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(record.status)} />
                            <span className="font-medium">{record.vehicles?.license_plate}</span>
                            <span className="text-sm text-gray-600">
                              {record.maintenance_task_types?.name || record.maintenance_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Scheduled: {format(new Date(record.scheduled_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming maintenance scheduled</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Records Tab */}
        <TabsContent value="records">
          <MaintenanceAllRecordsTab />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <MaintenanceNotificationsTab />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <MaintenanceSettingsTab />
        </TabsContent>

        {/* Parts & Inventory Tab (In-House Only) */}
        {inHouseEnabled && (
          <TabsContent value="parts">
            <MaintenancePartsInventoryTab />
          </TabsContent>
        )}

        {/* Calendar Tab (In-House Only) */}
        {inHouseEnabled && (
          <TabsContent value="calendar">
            <MaintenanceCalendarTab />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <AddMaintenanceRecordModal 
        open={addRecordOpen} 
        onOpenChange={setAddRecordOpen} 
      />
      <ScheduleRecurringServiceModal 
        open={scheduleRecurringOpen} 
        onOpenChange={setScheduleRecurringOpen} 
      />
    </div>
  );
};