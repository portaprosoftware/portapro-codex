import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, Clock, Calendar, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { format } from "date-fns";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  working_hours?: any;
}

interface ScheduledJob {
  id: string;
  job_type: string;
  scheduled_start: string;
  scheduled_end: string;
  service_locations: {
    address: string;
  };
}

interface DriverWithDetails extends Driver {
  status: "available" | "busy" | "scheduled";
  scheduledJobs: ScheduledJob[];
}

interface DriverSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedDriver?: DriverWithDetails;
  onDriverSelect: (driver: DriverWithDetails) => void;
}

export const DriverSelectionModal: React.FC<DriverSelectionModalProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedDriver,
  onDriverSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          user_roles!inner(role)
        `)
        .eq("user_roles.role", "driver")
        .order("first_name");

      if (error) throw error;
      return data as Driver[];
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["daily-driver-assignments", selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const { data, error } = await supabase
        .from("daily_vehicle_assignments")
        .select("driver_id")
        .eq("assignment_date", selectedDate.toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedDate,
  });

  // For now, disable scheduled jobs query due to schema mismatch
  // This can be enabled once the jobs table schema is clarified
  const jobs: any[] = [];

  const assignedDriverIds = new Set(assignments.map(a => a.driver_id));
  const jobsByDriver = jobs.reduce((acc, job) => {
    if (!acc[job.driver_id]) acc[job.driver_id] = [];
    acc[job.driver_id].push({
      id: job.id,
      job_type: job.job_type,
      scheduled_start: job.scheduled_start,
      scheduled_end: job.scheduled_end,
      service_locations: job.service_locations
    });
    return acc;
  }, {} as Record<string, ScheduledJob[]>);

  const driversWithDetails: DriverWithDetails[] = drivers.map(driver => {
    const hasAssignment = assignedDriverIds.has(driver.id);
    const scheduledJobs = jobsByDriver[driver.id] || [];
    const hasJobs = scheduledJobs.length > 0;
    
    let status: "available" | "busy" | "scheduled" = "available";
    if (hasAssignment) status = "busy";
    else if (hasJobs) status = "scheduled";

    return {
      ...driver,
      status,
      scheduledJobs,
    };
  });

  const filteredDrivers = driversWithDetails.filter(driver => {
    const matchesSearch = 
      `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "available") return matchesSearch && driver.status === "available";
    if (statusFilter === "busy") return matchesSearch && driver.status === "busy";
    if (statusFilter === "scheduled") return matchesSearch && driver.status === "scheduled";
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/10 text-green-700 border-green-200";
      case "scheduled": return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "busy": return "bg-red-500/10 text-red-700 border-red-200";
      default: return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "scheduled": return "Scheduled";
      case "busy": return "Busy";
      default: return "Unknown";
    }
  };

  const handleDriverSelect = (driver: DriverWithDetails) => {
    onDriverSelect(driver);
    onOpenChange(false);
  };

  const getDriverInitials = (driver: Driver) => {
    return `${driver.first_name?.[0] || ''}${driver.last_name?.[0] || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full max-w-none md:max-w-4xl md:h-auto">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none md:max-w-4xl md:h-auto md:max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Select Driver</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search drivers by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All ({filteredDrivers.length})
              </Button>
              <Button
                variant={statusFilter === "available" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("available")}
              >
                Available ({driversWithDetails.filter(d => d.status === "available").length})
              </Button>
              <Button
                variant={statusFilter === "scheduled" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("scheduled")}
              >
                Scheduled ({driversWithDetails.filter(d => d.status === "scheduled").length})
              </Button>
              <Button
                variant={statusFilter === "busy" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("busy")}
              >
                Busy ({driversWithDetails.filter(d => d.status === "busy").length})
              </Button>
            </div>
          </div>

          {/* Driver List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {filteredDrivers.map((driver) => {
                const isSelected = selectedDriver?.id === driver.id;
                
                return (
                  <div
                    key={driver.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleDriverSelect(driver)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getDriverInitials(driver)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">
                            {driver.first_name} {driver.last_name}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(driver.status)}`}
                          >
                            {getStatusText(driver.status)}
                          </Badge>
                        </div>

                        {/* Working Hours */}
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>08:00:00 - 17:00:00</span>
                        </div>

                        {/* Time Slots */}
                        <div className="flex gap-2 mb-3">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Morning: Available
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Afternoon: Available
                          </Badge>
                        </div>

                        {/* Scheduled Jobs */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Schedule for {format(selectedDate, 'MMM d, yyyy')}</span>
                          </div>
                          
                          {driver.scheduledJobs.length === 0 ? (
                            <p className="text-sm text-muted-foreground ml-5">No jobs scheduled</p>
                          ) : (
                            <div className="ml-5 space-y-1">
                              {driver.scheduledJobs.map((job) => (
                                <div key={job.id} className="text-sm bg-muted/50 p-2 rounded">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">{job.job_type}</p>
                                      {job.service_locations?.address && (
                                        <p className="text-xs text-muted-foreground">{job.service_locations.address}</p>
                                      )}
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                      <p>{format(new Date(job.scheduled_start), 'h:mm a')}</p>
                                      <p>to {format(new Date(job.scheduled_end), 'h:mm a')}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredDrivers.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No drivers found matching your criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {selectedDriver && (
          <div className="p-6 pt-4 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedDriver.first_name} {selectedDriver.last_name}</p>
                <p className="text-sm text-muted-foreground">
                  {getStatusText(selectedDriver.status)} • {selectedDriver.scheduledJobs.length} scheduled jobs
                </p>
              </div>
              <Button onClick={() => onOpenChange(false)}>
                Confirm Selection
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};