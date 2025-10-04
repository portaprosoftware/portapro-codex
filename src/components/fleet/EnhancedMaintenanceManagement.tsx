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
import { getCurrentDateInTimezone } from "@/lib/timezoneUtils";
import { AddMaintenanceRecordModal } from "./AddMaintenanceRecordModal";
import { TechnicianAssignmentModal } from "./TechnicianAssignmentModal";
import { AddRecurringServiceSlider } from "./AddRecurringServiceSlider";
import { MaintenanceAllRecordsTab } from "./MaintenanceAllRecordsTab";

import { MaintenanceSettingsTab } from "./MaintenanceSettingsTab";
import { MaintenancePartsInventoryTab } from "./MaintenancePartsInventoryTab";
import { MaintenanceCalendarTab } from "./MaintenanceCalendarTab";
import { DVIRList } from "./DVIRList";
import { WorkOrdersBoard } from "./WorkOrdersBoard";
import { PMSchedulesTab } from "./PMSchedulesTab";
import { MaintenanceRecordCard } from "./maintenance/MaintenanceRecordCard";
import { MaintenanceRecordModal } from "./maintenance/MaintenanceRecordModal";

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
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [editRecordOpen, setEditRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
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

  // Fetch company timezone
  const { data: companyTimezoneSettings } = useQuery({
    queryKey: ["company-timezone-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("company_timezone")
        .single();
      if (error) throw error;
      return data;
    }
  });

  const inHouseEnabled = companySettings?.enable_inhouse_features || false;

  // Fetch maintenance KPIs
  // Query for due today count
  const { data: dueTodayCount, isLoading: dueTodayLoading } = useQuery({
    queryKey: ["maintenance-due-today"],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("id")
        .eq("scheduled_date", today)
        .in("status", ["scheduled", "in_progress"]);
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Query for YTD maintenance costs
  const { data: ytdMaintenanceCosts, isLoading: ytdCostsLoading } = useQuery({
    queryKey: ["maintenance-ytd-costs"],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("cost, total_cost, parts_cost, labor_cost")
        .eq("status", "completed")
        .gte("completed_date", startOfYear);
      
      if (error) throw error;
      
      // Sum up all the costs
      const totalCosts = data?.reduce((sum, record) => {
        // Use total_cost if available, otherwise fall back to cost, parts_cost + labor_cost
        const recordCost = record.total_cost || record.cost || (record.parts_cost || 0) + (record.labor_cost || 0);
        return sum + (recordCost || 0);
      }, 0) || 0;
      
      return totalCosts;
    }
  });

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
    queryKey: ["overdue-maintenance", companyTimezoneSettings?.company_timezone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type, make, model, nickname),
          maintenance_task_types(name),
          maintenance_vendors(name)
        `)
        .lt("scheduled_date", getCurrentDateInTimezone(companyTimezoneSettings?.company_timezone || 'America/New_York'))
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as MaintenanceRecord[];
    }
  });

  // Fetch upcoming maintenance records for overview
  const { data: upcomingRecords } = useQuery({
    queryKey: ["upcoming-maintenance", companyTimezoneSettings?.company_timezone],
    queryFn: async () => {
      const companyTimezone = companyTimezoneSettings?.company_timezone || 'America/New_York';
      const today = getCurrentDateInTimezone(companyTimezone);
      const nextWeek = getCurrentDateInTimezone(companyTimezone);
      
      // Add 7 days to today for next week calculation
      const todayDate = new Date(today + 'T00:00:00');
      const nextWeekDate = new Date(todayDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekStr = nextWeekDate.getFullYear() + '-' + 
                          String(nextWeekDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(nextWeekDate.getDate()).padStart(2, '0');
      
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type, make, model, nickname),
          maintenance_task_types(name),
          maintenance_vendors(name)
        `)
        .gte("scheduled_date", today)
        .lte("scheduled_date", nextWeekStr)
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
    if (action === 'view') {
      setSelectedRecord(record);
      setIsModalOpen(true);
    } else if (action === 'edit') {
      setEditingRecord(record);
      setEditRecordOpen(true);
    } else {
      console.log(`${action} maintenance record:`, record.id);
      // TODO: Implement delete functionality
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
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={() => setAddRecordOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0 px-4 py-2 h-10"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Maintenance Service
              </Button>
              <Button
                variant="outline"
                onClick={() => setScheduleRecurringOpen(true)}
                className="border-blue-500 text-blue-600 hover:bg-blue-50 px-4 py-2 h-10"
                size="sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Recurring Service
              </Button>
            </div>
          </div>

          {/* Tab Navigation Inside Card */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white rounded-full p-1 shadow-sm border w-fit overflow-x-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="records" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">All Records</TabsTrigger>
              <TabsTrigger value="dvir" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">DVIR</TabsTrigger>
              <TabsTrigger value="pm" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">PM Schedules</TabsTrigger>
              <TabsTrigger value="workorders" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-0 rounded-full px-3 py-2 text-sm whitespace-nowrap">Work Orders</TabsTrigger>
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
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
                title="Due Today"
                value={dueTodayCount || 0}
                icon={Calendar}
                gradientFrom="#3b82f6"
                gradientTo="#2563eb"
                iconBg="#3b82f6"
                animateValue={!dueTodayLoading}
              />
              <StatCard
                title="Year-to-Date"
                subtitle="Maintenance Costs"
                value={`$${(ytdMaintenanceCosts || 0).toLocaleString()}`}
                icon={DollarSign}
                gradientFrom="#10b981"
                gradientTo="#059669"
                iconBg="#10b981"
                animateValue={!ytdCostsLoading}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
            </TabsContent>

        <TabsContent value="records">
          <MaintenanceAllRecordsTab />
        </TabsContent>

        {/* DVIR Tab */}
        <TabsContent value="dvir">
          <DVIRList />
        </TabsContent>

        {/* PM Schedules Tab */}
        <TabsContent value="pm">
          <PMSchedulesTab />
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="workorders">
          <WorkOrdersBoard />
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
        </div>
      </div>

      {/* Modals */}
      <MaintenanceRecordModal
        record={selectedRecord}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
        onEdit={(record) => handleMaintenanceAction('edit', record)}
        onDelete={(record) => handleMaintenanceAction('delete', record)}
      />

      {/* Add Maintenance Record Drawer */}
      <AddMaintenanceRecordDrawer 
        open={addRecordOpen} 
        onOpenChange={setAddRecordOpen} 
      />
      
      {/* Edit Maintenance Record Drawer */}
      <AddMaintenanceRecordDrawer 
        open={editRecordOpen} 
        onOpenChange={setEditRecordOpen}
        editRecord={editingRecord}
        mode="edit"
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
