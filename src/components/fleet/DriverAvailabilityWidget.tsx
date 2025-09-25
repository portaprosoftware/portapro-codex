import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Search, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  working_hours?: any[];
}

interface DriverAvailabilityWidgetProps {
  selectedDate?: Date;
  selectedDriver?: any;
  onDriverSelect?: (driver: any) => void;
  selectionMode?: boolean;
  className?: string;
}

export const DriverAvailabilityWidget: React.FC<DriverAvailabilityWidgetProps> = ({
  selectedDate = new Date(),
  selectedDriver,
  onDriverSelect,
  selectionMode = false,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers-availability", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          user_roles!inner(role)
        `)
        .eq("user_roles.role", "driver");
      
      if (error) throw error;
      return data as Driver[];
    },
  });

  const { data: workingHours } = useQuery({
    queryKey: ["driver-working-hours", selectedDate],
    queryFn: async () => {
      const dayOfWeek = selectedDate.getDay();
      const { data, error } = await supabase
        .from("driver_working_hours")
        .select("driver_id, is_active, start_time, end_time")
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true);
      
      if (error) throw error;
      return data.reduce((acc, hour) => {
        acc[hour.driver_id] = hour;
        return acc;
      }, {} as Record<string, any>);
    },
  });

  const { data: assignments } = useQuery({
    queryKey: ["driver-assignments", selectedDate],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("daily_vehicle_assignments")
        .select("driver_id")
        .eq("assignment_date", dateStr);
      
      if (error) throw error;
      return data.map(a => a.driver_id);
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["driver-jobs", selectedDate],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          driver_id,
          scheduled_time,
          job_type,
          customers!inner(name)
        `)
        .eq("scheduled_date", dateStr)
        .in("status", ["assigned", "in_progress"]);
      
      if (error) throw error;
      return data.reduce((acc, job) => {
        if (job.driver_id) {
          if (!acc[job.driver_id]) {
            acc[job.driver_id] = [];
          }
          acc[job.driver_id].push({
            scheduled_time: job.scheduled_time,
            job_type: job.job_type,
            customer_name: job.customers?.name || 'Unknown Customer'
          });
        }
        return acc;
      }, {} as Record<string, any[]>);
    },
  });

  const filteredDrivers = drivers?.filter(driver => 
    `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDriverStatus = (driverId: string) => {
    const hasAssignment = assignments?.includes(driverId);
    const jobList = jobs?.[driverId] || [];
    
    if (hasAssignment || jobList.length > 0) return "assigned";
    
    // Check if driver has working hours set for this day
    const driverWorkingHour = workingHours?.[driverId];
    const isScheduledToWork = !!driverWorkingHour;
    
    return isScheduledToWork ? "available" : "off-duty";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800 border-green-200";
      case "assigned": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "off-duty": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "assigned": return "Assigned";
      case "off-duty": return "Off-Duty";
      default: return "Unknown";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Driver Availability</h3>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Available</span>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Assigned</span>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Off-Duty</span>
            </div>
          </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drivers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredDrivers?.map((driver) => {
          const status = getDriverStatus(driver.id);
          const jobList = jobs?.[driver.id] || [];
          const isSelected = selectedDriver?.id === driver.id;
          
          return (
            <Card
              key={driver.id}
              className={cn(
                "p-3 cursor-pointer transition-all hover:shadow-sm",
                selectionMode && "hover:bg-accent/50",
                isSelected && "ring-2 ring-primary bg-accent/30",
                !selectionMode && "cursor-default"
              )}
              onClick={() => {
                if (selectionMode && onDriverSelect) {
                  const driverWithDetails = {
                    ...driver,
                    availability_status: getStatusText(status),
                    working_hours: "08:00:00 - 17:00:00",
                    scheduled_jobs: jobList
                  };
                  onDriverSelect(driverWithDetails);
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(driver.first_name, driver.last_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {driver.first_name} {driver.last_name}
                    </p>
                    <Badge variant="outline" className={getStatusColor(status)}>
                      {getStatusText(status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    {jobList.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {jobList.length} job{jobList.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {workingHours?.[driver.id] 
                          ? `${workingHours[driver.id].start_time.slice(0, 5)} - ${workingHours[driver.id].end_time.slice(0, 5)}`
                          : "Not scheduled"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredDrivers?.length === 0 && (
        <div className="text-center py-6">
          <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No drivers found</p>
        </div>
      )}
    </div>
  );
};