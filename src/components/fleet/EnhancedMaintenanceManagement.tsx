import React, { useState } from "react";
import { AddMaintenanceRecordDrawer } from "./AddMaintenanceRecordDrawer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Calendar, Settings, Bell, Package, Wrench, AlertTriangle, Clock, DollarSign, UserPlus } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { format } from "date-fns";
import { AddMaintenanceRecordModal } from "./AddMaintenanceRecordModal";
import { TechnicianAssignmentModal } from "./TechnicianAssignmentModal";
import { AddRecurringServiceSlider } from "./AddRecurringServiceSlider";
import { MaintenanceAllRecordsTab } from "./MaintenanceAllRecordsTab";
import { MaintenanceNotificationsTab } from "./MaintenanceNotificationsTab";
import { MaintenanceSettingsTab } from "./MaintenanceSettingsTab";
import { MaintenancePartsInventoryTab } from "./MaintenancePartsInventoryTab";
import { MaintenanceCalendarTab } from "./MaintenanceCalendarTab";
import { DVIRList } from "./DVIRList";
import { WorkOrdersBoard } from "./WorkOrdersBoard";
import { PMSchedulesTab } from "./PMSchedulesTab";
import { MaintenanceRecordCard } from "./maintenance/MaintenanceRecordCard";

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
    make?: string;
    model?: string;
    nickname?: string;
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
  const [technicianAssignmentOpen, setTechnicianAssignmentOpen] = useState(false);
  const [selectedMaintenanceRecord, setSelectedMaintenanceRecord] = useState<string | null>(null);

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

  const inHouseEnabled = companySettings?.enable_inhouse_features || false;

  // Fetch maintenance KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["maintenance-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_maintenance_kpis");
      if (error) throw error;
      return data as unknown as MaintenanceKPIs;
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
          vehicles(license_plate, vehicle_type, make, model, nickname),
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
          vehicles(license_plate, vehicle_type, make, model, nickname),
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

  const handleMaintenanceAction = (action: 'view' | 'edit' | 'delete', record: MaintenanceRecord) => {
    console.log(`${action} maintenance record:`, record.id);
    // TODO: Implement actual navigation/modal logic
    switch (action) {
      case 'view':
        // Navigate to detail view or open modal
        break;
      case 'edit':
        // Navigate to edit form or open modal
        break;
      case 'delete':
        // Show confirmation dialog and delete
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Integrated Tab Navigation */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
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
                className="border-blue-500 text-blue-600 hover:bg-blue-50 px-4 py-2 h-10"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Recurring Service
              </Button>
              <Button
                onClick={() => setAddRecordOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0 px-4 py-2 h-10"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Maintenance Record
              </Button>
            </div>
          </div>

          {/* Tab Navigation Inside Card */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white rounded-full p-1 shadow-sm border w-fit overflow-x-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="records" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">All Records</TabsTrigger>
              <TabsTrigger value="dvir" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">DVIR</TabsTrigger>
              <TabsTrigger value="workorders" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Work Orders</TabsTrigger>
              <TabsTrigger value="pm" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">PM Schedules</TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Notifications</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Settings</TabsTrigger>
              {inHouseEnabled && (
                <>
                  <TabsTrigger value="parts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Parts & Inventory</TabsTrigger>
                  <TabsTrigger value="calendar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Calendar</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
          <div className="max-w-6xl">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Past Due"
                value={kpis?.past_due || 0}
                icon={AlertTriangle}
                gradientFrom="#ef4444"
                gradientTo="#dc2626"
                iconBg="#ef4444"
                animateValue={!kpisLoading}
              />
              <StatCard
                title="Due This Week"
                value={kpis?.due_this_week || 0}
                icon={Clock}
                gradientFrom="#f97316"
                gradientTo="#ea580c"
                iconBg="#f97316"
                animateValue={!kpisLoading}
              />
              <StatCard
                title="In Progress"
                value={kpis?.in_progress || 0}
                icon={Wrench}
                gradientFrom="#3b82f6"
                gradientTo="#2563eb"
                iconBg="#3b82f6"
                animateValue={!kpisLoading}
              />
              <StatCard
                title="YTD Maintenance Spend"
                value={`$${(kpis?.ytd_spend || 0).toLocaleString()}`}
                icon={DollarSign}
                gradientFrom="#10b981"
                gradientTo="#059669"
                iconBg="#10b981"
                animateValue={!kpisLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Overdue List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
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
                         <MaintenanceRecordCard
                           key={record.id}
                           record={record}
                           variant="overview"
                           onView={(record) => handleMaintenanceAction('view', record)}
                           onEdit={(record) => handleMaintenanceAction('edit', record)}
                           onDelete={(record) => handleMaintenanceAction('delete', record)}
                         />
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
                  <CardTitle className="flex items-center gap-2 text-lg">
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
                         <MaintenanceRecordCard
                           key={record.id}
                           record={record}
                           variant="overview"
                           onView={(record) => handleMaintenanceAction('view', record)}
                           onEdit={(record) => handleMaintenanceAction('edit', record)}
                           onDelete={(record) => handleMaintenanceAction('delete', record)}
                         />
                       ))}
                     </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No upcoming maintenance scheduled</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* All Records Tab */}
        <TabsContent value="records">
          <div className="max-w-6xl">
            <MaintenanceAllRecordsTab />
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="max-w-6xl">
            <MaintenanceNotificationsTab />
          </div>
        </TabsContent>

        {/* DVIR Tab */}
        <TabsContent value="dvir">
          <div className="max-w-6xl">
            <DVIRList />
          </div>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="workorders">
          <div className="max-w-6xl">
            <WorkOrdersBoard />
          </div>
        </TabsContent>

        {/* PM Schedules Tab */}
        <TabsContent value="pm">
          <div className="max-w-6xl">
            <PMSchedulesTab />
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="max-w-6xl">
            <MaintenanceSettingsTab />
          </div>
        </TabsContent>

        {/* Parts & Inventory Tab (In-House Only) */}
        {inHouseEnabled && (
          <TabsContent value="parts">
            <div className="max-w-6xl">
              <MaintenancePartsInventoryTab />
            </div>
          </TabsContent>
        )}

        {/* Calendar Tab (In-House Only) */}
        {inHouseEnabled && (
          <TabsContent value="calendar">
            <div className="max-w-6xl">
              <MaintenanceCalendarTab />
            </div>
          </TabsContent>
        )}
      </Tabs>
        </div>
      </div>

      {/* Add Maintenance Record Drawer */}
      <AddMaintenanceRecordDrawer 
        open={addRecordOpen} 
        onOpenChange={setAddRecordOpen} 
      />
      <AddRecurringServiceSlider 
        open={scheduleRecurringOpen} 
        onOpenChange={setScheduleRecurringOpen} 
      />
      <TechnicianAssignmentModal
        open={technicianAssignmentOpen}
        onOpenChange={setTechnicianAssignmentOpen}
        maintenanceRecordId={selectedMaintenanceRecord}
      />
    </div>
  );
};
