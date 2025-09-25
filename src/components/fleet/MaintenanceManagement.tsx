
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/StatCard";
import { AlertTriangle, Clock, Settings, DollarSign, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string | null;
  completed_date: string | null;
  cost: number | null;
  vehicles: {
    license_plate: string;
    vehicle_type: string;
  };
}

export const MaintenanceManagement: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <MaintenanceManagementContent />
    </div>
  );
};

const MaintenanceManagementContent: React.FC = () => {
  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ["maintenance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type)
        `)
        .order("scheduled_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const getOverdueItems = () => {
    const today = new Date();
    return maintenanceRecords?.filter(record => 
      record.scheduled_date && 
      new Date(record.scheduled_date) < today && 
      record.status === "scheduled"
    ) || [];
  };

  const getDueThisWeek = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return maintenanceRecords?.filter(record => 
      record.scheduled_date && 
      new Date(record.scheduled_date) >= today &&
      new Date(record.scheduled_date) <= nextWeek &&
      record.status === "scheduled"
    ) || [];
  };

  const getScheduledToday = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return maintenanceRecords?.filter(record => 
      record.scheduled_date && 
      record.scheduled_date.split('T')[0] === todayStr &&
      record.status === "scheduled"
    ) || [];
  };

  const getTotalCompletedCost = () => {
    return maintenanceRecords
      ?.filter(record => record.status === "completed")
      ?.reduce((total, record) => total + (record.cost || 0), 0) || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case "in_progress":
        return "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold border-0";
      case "completed":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "cancelled":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const overdueItems = getOverdueItems();
  const dueThisWeek = getDueThisWeek();
  const scheduledToday = getScheduledToday();
  const totalCost = getTotalCompletedCost();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Maintenance items past due"
          value={overdueItems.length}
          icon={AlertTriangle}
          gradientFrom="#E53E3E"
          gradientTo="#FC8181"
          iconBg="#E53E3E"
          subtitleColor="text-red-600"
        />
        
        <StatCard
          title="Items scheduled this week"
          value={dueThisWeek.length}
          icon={Clock}
          gradientFrom="#DD6B20"
          gradientTo="#F6AD55"
          iconBg="#DD6B20"
          subtitleColor="text-orange-600"
        />
        
        <StatCard
          title="Scheduled Today"
          value={scheduledToday.length}
          icon={Wrench}
          gradientFrom="#3366FF"
          gradientTo="#6699FF"
          iconBg="#3366FF"
          subtitleColor="text-blue-600"
          animateValue={true}
        />
        
        <StatCard
          title="Year-to-Date"
          subtitle="Maintenance Spend"
          value={`$${totalCost.toFixed(2)}`}
          icon={DollarSign}
          gradientFrom="#2F855A"
          gradientTo="#68D391"
          iconBg="#2F855A"
          subtitleColor="text-green-600"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-records">All Records</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overdue Section */}
          {overdueItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-700">Overdue Maintenance</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                {overdueItems.map((record) => (
                  <Card key={record.id} className="p-4 border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {record.vehicles?.license_plate} - {record.maintenance_type}
                        </h4>
                        <p className="text-sm text-gray-600">{record.description}</p>
                        <p className="text-sm text-red-600">
                          Due: {record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View & Update
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Due This Week */}
          {dueThisWeek.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-amber-700">Due This Week</h3>
              <div className="space-y-3">
                {dueThisWeek.map((record) => (
                  <Card key={record.id} className="p-4 border-l-4 border-l-amber-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {record.vehicles?.license_plate} - {record.maintenance_type}
                        </h4>
                        <p className="text-sm text-gray-600">{record.description}</p>
                        <p className="text-sm text-amber-600">
                          Scheduled: {record.scheduled_date ? new Date(record.scheduled_date).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View & Update
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-records" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">All Maintenance Records</h3>
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </div>
          
          <div className="space-y-3">
            {maintenanceRecords?.map((record) => (
              <Card key={record.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {record.vehicles?.license_plate} - {record.maintenance_type}
                      </h4>
                      <p className="text-sm text-gray-600">{record.description}</p>
                      <p className="text-sm text-gray-500">
                        {record.vehicles?.vehicle_type} • 
                        {record.scheduled_date ? ` Scheduled: ${new Date(record.scheduled_date).toLocaleDateString()}` : ""} •
                        {record.cost ? ` Cost: $${record.cost}` : " No cost recorded"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={cn("capitalize", getStatusColor(record.status))}>
                      {record.status.replace("_", " ")}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Maintenance Notifications</h3>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configure Settings
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Email Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">7-day reminders</span>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Day-of reminders</span>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overdue alerts</span>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">SMS Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Critical overdue items</span>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Same-day reminders</span>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Maintenance Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Default Maintenance Intervals</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="oil_change">Oil Change (miles)</Label>
                    <Input id="oil_change" type="number" defaultValue="5000" />
                  </div>
                  <div>
                    <Label htmlFor="tire_rotation">Tire Rotation (miles)</Label>
                    <Input id="tire_rotation" type="number" defaultValue="7500" />
                  </div>
                  <div>
                    <Label htmlFor="brake_inspection">Brake Inspection (miles)</Label>
                    <Input id="brake_inspection" type="number" defaultValue="12000" />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Notification Timing</h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reminder_days">Advance reminder (days)</Label>
                    <Input id="reminder_days" type="number" defaultValue="7" />
                  </div>
                  <div>
                    <Label htmlFor="notification_time">Daily notification time</Label>
                    <Input id="notification_time" type="time" defaultValue="08:00" />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Notification email</Label>
                    <Input id="contact_email" type="email" placeholder="maintenance@company.com" />
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button>Save Settings</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
