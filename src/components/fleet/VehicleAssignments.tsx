import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedDateNavigator } from "@/components/jobs/EnhancedDateNavigator";
import { AssignmentCreationWizard } from "./AssignmentCreationWizard";
import { AssignmentEditModal } from "./AssignmentEditModal";
import { Truck, User, Clock, Calendar, Plus, TrendingUp, BarChart3, Activity } from "lucide-react";
import { format } from "date-fns";

export function VehicleAssignments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const handleEditAssignment = (assignment: any) => {
    console.log('Edit assignment clicked:', assignment);
    setSelectedAssignment(assignment);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Assignments</h1>
          <p className="text-gray-600 mt-1">
            Manage daily vehicle assignments for your drivers
          </p>
        </div>
        <Button 
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </Button>
      </div>

      {/* Date Navigator */}
      <EnhancedDateNavigator
        date={selectedDate}
        onDateChange={setSelectedDate}
        label="Assignment Date"
      />

      {/* Stats Cards */}
      <VehicleAssignmentsStats selectedDate={selectedDate} />

      {/* Assignments Content */}
      <VehicleAssignmentsContent 
        selectedDate={selectedDate} 
        onEditAssignment={handleEditAssignment}
        onCreateAssignment={() => setWizardOpen(true)}
      />

      {/* Assignment Creation Wizard */}
      <AssignmentCreationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initialDate={selectedDate}
      />

      {/* Assignment Edit Modal */}
      <AssignmentEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        assignment={selectedAssignment}
      />
    </div>
  );
}

function VehicleAssignmentsStats({ selectedDate }: { selectedDate: Date }) {
  // Get total vehicles
  const { data: totalVehicles = 0 } = useQuery({
    queryKey: ["total-vehicles"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("status", "available");
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Get available vehicles (not assigned today)
  const { data: availableVehicles = 0 } = useQuery({
    queryKey: ["available-vehicles", selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      // Get all available vehicles
      const { data: allVehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id")
        .eq("status", "available");
      
      if (vehiclesError) throw vehiclesError;
      
      // Get assigned vehicle IDs for the selected date
      const { data: assignments, error: assignmentsError } = await supabase
        .from("daily_vehicle_assignments")
        .select("vehicle_id")
        .eq("assignment_date", dateStr);
      
      if (assignmentsError) throw assignmentsError;
      
      const assignedVehicleIds = new Set(assignments?.map(a => a.vehicle_id) || []);
      const availableCount = (allVehicles || []).filter(v => !assignedVehicleIds.has(v.id)).length;
      
      return availableCount;
    },
  });

  // Get assignments for today
  const { data: todayAssignments = 0 } = useQuery({
    queryKey: ["today-assignments", selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { count, error } = await supabase
        .from("daily_vehicle_assignments")
        .select("*", { count: "exact", head: true })
        .eq("assignment_date", dateStr);
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Truck className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVehicles}</div>
          <p className="text-xs text-muted-foreground">
            Available fleet vehicles
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assigned Today</CardTitle>
          <User className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayAssignments}</div>
          <p className="text-xs text-muted-foreground">
            Vehicles assigned for {format(selectedDate, "MMM d")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available</CardTitle>
          <Activity className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableVehicles}</div>
          <p className="text-xs text-muted-foreground">
            Ready for assignment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function VehicleAssignmentsContent({ 
  selectedDate, 
  onEditAssignment,
  onCreateAssignment
}: { 
  selectedDate: Date; 
  onEditAssignment: (assignment: any) => void;
  onCreateAssignment: () => void;
}) {
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ["daily-vehicle-assignments", selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      console.log('Fetching assignments for date:', dateStr);
      
      // First get the assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("daily_vehicle_assignments")
        .select("*")
        .eq("assignment_date", dateStr)
        .order("created_at", { ascending: false });
      
      if (assignmentsError) {
        console.error('Assignments error:', assignmentsError);
        throw assignmentsError;
      }
      
      if (!assignmentsData || assignmentsData.length === 0) {
        console.log('No assignments found for date:', dateStr);
        return [];
      }

      console.log('Found assignments:', assignmentsData);

      // Get vehicle data
      const vehicleIds = assignmentsData.map(a => a.vehicle_id).filter(Boolean);
      let vehiclesData = [];
      if (vehicleIds.length > 0) {
        const { data: vData, error: vehiclesError } = await supabase
          .from("vehicles")
          .select("id, license_plate, vehicle_type, make, model, year, status")
          .in("id", vehicleIds);
        
        if (vehiclesError) {
          console.error('Vehicles error:', vehiclesError);
        } else {
          vehiclesData = vData || [];
          console.log('Found vehicles:', vehiclesData);
        }
      }

      // Get profile data - try both UUID and text-based driver IDs
      const driverIds = assignmentsData.map(a => a.driver_id).filter(Boolean);
      let profilesData = [];
      if (driverIds.length > 0) {
        // First try to get profiles by ID (UUID format)
        const { data: pDataById, error: profilesByIdError } = await supabase
          .from("profiles")
          .select("id, clerk_user_id, first_name, last_name")
          .in("id", driverIds);
        
        if (profilesByIdError) {
          console.error('Profiles by ID error:', profilesByIdError);
        }

        // Then try to get profiles by clerk_user_id (text format)
        const { data: pDataByClerkId, error: profilesByClerkIdError } = await supabase
          .from("profiles")
          .select("id, clerk_user_id, first_name, last_name")
          .in("clerk_user_id", driverIds);
        
        if (profilesByClerkIdError) {
          console.error('Profiles by clerk_user_id error:', profilesByClerkIdError);
        }

        // Combine both results, removing duplicates
        const allProfiles = [...(pDataById || []), ...(pDataByClerkId || [])];
        profilesData = allProfiles.filter((profile, index, self) => 
          index === self.findIndex(p => p.id === profile.id)
        );
        
        console.log('Found profiles:', profilesData);
      }

      // Combine the data
      const combinedData = assignmentsData.map(assignment => {
        const vehicle = vehiclesData.find(v => v.id === assignment.vehicle_id);
        const profile = profilesData.find(p => 
          p.id === assignment.driver_id || p.clerk_user_id === assignment.driver_id
        );
        
        console.log(`Assignment ${assignment.id}:`, {
          vehicle_id: assignment.vehicle_id,
          driver_id: assignment.driver_id,
          found_vehicle: vehicle,
          found_profile: profile
        });

        return {
          ...assignment,
          vehicles: vehicle,
          profiles: profile
        };
      });

      console.log('Final combined data:', combinedData);
      return combinedData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assignments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('Assignment query error:', error);
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p>Error loading assignments. Please try again.</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No assignments for {format(selectedDate, "PPP")}</h3>
            <p className="text-sm mb-4">Create your first vehicle assignment for this date.</p>
            <Button onClick={onCreateAssignment} className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Assignment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Assignments for {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </h2>
        <span className="text-sm text-gray-500">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                {/* Vehicle & Driver Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {assignment.vehicles?.license_plate || "Unknown Vehicle"}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {assignment.vehicles ? 
                        `${assignment.vehicles.make || ''} ${assignment.vehicles.model || ''} • ${assignment.vehicles.vehicle_type?.toUpperCase() || ''}`.trim() :
                        "Vehicle details unavailable"
                      }
                    </p>
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {assignment.profiles?.first_name && assignment.profiles?.last_name ? 
                        `${assignment.profiles.first_name} ${assignment.profiles.last_name}` :
                        "Driver not found"
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {assignment.start_mileage ? `Start: ${assignment.start_mileage.toLocaleString()}` : "No start mileage"}
                      {assignment.end_mileage ? ` • End: ${assignment.end_mileage.toLocaleString()}` : ""}
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onEditAssignment(assignment)}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {assignment.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{assignment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}