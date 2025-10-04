import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Calendar, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { getCurrentDateInTimezone } from "@/lib/timezoneUtils";
import { MaintenanceRecordCard } from "../maintenance/MaintenanceRecordCard";
import { AddMaintenanceRecordModal } from "../AddMaintenanceRecordModal";

interface VehicleMaintenanceOverviewTabProps {
  vehicleId: string;
  licensePlate: string;
}

export const VehicleMaintenanceOverviewTab: React.FC<VehicleMaintenanceOverviewTabProps> = ({
  vehicleId,
  licensePlate
}) => {
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  
  // Fetch company timezone
  const { data: companySettings } = useQuery({
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

  // Fetch past due maintenance for this vehicle
  const { data: pastDueCount, isLoading: pastDueLoading } = useQuery({
    queryKey: ["vehicle-maintenance-past-due", vehicleId, companySettings?.company_timezone],
    queryFn: async () => {
      const today = getCurrentDateInTimezone(companySettings?.company_timezone || 'America/New_York');
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .lt("scheduled_date", today)
        .in("status", ["scheduled", "in_progress"]);
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Fetch due this week maintenance for this vehicle
  const { data: dueThisWeekCount, isLoading: dueThisWeekLoading } = useQuery({
    queryKey: ["vehicle-maintenance-due-this-week", vehicleId, companySettings?.company_timezone],
    queryFn: async () => {
      const companyTimezone = companySettings?.company_timezone || 'America/New_York';
      const today = getCurrentDateInTimezone(companyTimezone);
      const todayDate = new Date(today + 'T00:00:00');
      const nextWeekDate = new Date(todayDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekStr = nextWeekDate.getFullYear() + '-' + 
                          String(nextWeekDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(nextWeekDate.getDate()).padStart(2, '0');
      
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .gte("scheduled_date", today)
        .lte("scheduled_date", nextWeekStr)
        .eq("status", "scheduled");
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Fetch due today count
  const { data: dueTodayCount, isLoading: dueTodayLoading } = useQuery({
    queryKey: ["vehicle-maintenance-due-today", vehicleId],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .eq("scheduled_date", today)
        .in("status", ["scheduled", "in_progress"]);
      
      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Fetch YTD maintenance costs for this vehicle
  const { data: ytdCosts, isLoading: ytdCostsLoading } = useQuery({
    queryKey: ["vehicle-maintenance-ytd-costs", vehicleId],
    queryFn: async () => {
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("cost, total_cost, parts_cost, labor_cost")
        .eq("vehicle_id", vehicleId)
        .eq("status", "completed")
        .gte("completed_date", startOfYear);
      
      if (error) throw error;
      
      const totalCosts = data?.reduce((sum, record) => {
        const recordCost = record.total_cost || record.cost || (record.parts_cost || 0) + (record.labor_cost || 0);
        return sum + (recordCost || 0);
      }, 0) || 0;
      
      return totalCosts;
    }
  });

  // Fetch overdue maintenance records for this vehicle
  const { data: overdueRecords } = useQuery({
    queryKey: ["vehicle-overdue-maintenance", vehicleId, companySettings?.company_timezone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type, make, model, nickname),
          maintenance_task_types(name),
          maintenance_vendors(name)
        `)
        .eq("vehicle_id", vehicleId)
        .lt("scheduled_date", getCurrentDateInTimezone(companySettings?.company_timezone || 'America/New_York'))
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch upcoming maintenance records for this vehicle
  const { data: upcomingRecords } = useQuery({
    queryKey: ["vehicle-upcoming-maintenance", vehicleId, companySettings?.company_timezone],
    queryFn: async () => {
      const companyTimezone = companySettings?.company_timezone || 'America/New_York';
      const today = getCurrentDateInTimezone(companyTimezone);
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
        .eq("vehicle_id", vehicleId)
        .gte("scheduled_date", today)
        .lte("scheduled_date", nextWeekStr)
        .eq("status", "scheduled")
        .order("scheduled_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  const handleMaintenanceAction = (action: 'view' | 'edit' | 'delete', record: any) => {
    // TODO: Implement actions or pass handlers from parent
    console.log(`${action} maintenance record:`, record.id);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Maintenance Overview</h2>
            <p className="text-gray-600">Vehicle: {licensePlate}</p>
          </div>
          <Button
            onClick={() => setAddRecordOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Maintenance Service
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Past Due"
          value={pastDueCount || 0}
          icon={AlertTriangle}
          gradientFrom="#ef4444"
          gradientTo="#dc2626"
          iconBg="#ef4444"
          animateValue={!pastDueLoading}
        />
        <StatCard
          title="Due This Week"
          value={dueThisWeekCount || 0}
          icon={Clock}
          gradientFrom="#f97316"
          gradientTo="#ea580c"
          iconBg="#f97316"
          animateValue={!dueThisWeekLoading}
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
          value={`$${(ytdCosts || 0).toLocaleString()}`}
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
      </div>

      {/* Add Maintenance Record Modal */}
      <AddMaintenanceRecordModal
        open={addRecordOpen}
        onOpenChange={setAddRecordOpen}
        preselectedVehicleId={vehicleId}
      />
    </>
  );
};
