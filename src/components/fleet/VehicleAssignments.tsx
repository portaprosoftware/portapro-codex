import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EnhancedDateNavigator } from "@/components/jobs/EnhancedDateNavigator";
import { AssignmentCreationWizard } from "./AssignmentCreationWizard";
import { AssignmentViewModal } from "./AssignmentViewModal";
import { AssignmentActionsMenu } from "./AssignmentActionsMenu";
import { Truck, User, Clock, Calendar, Plus, TrendingUp, BarChart3, Activity } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getVehicleTypeDisplayName } from "@/lib/vehicleTypeUtils";
import { useSearchParams } from "react-router-dom";

export function VehicleAssignments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [vehicleContextId, setVehicleContextId] = useState<string | null>(null);
  const [vehicleContextName, setVehicleContextName] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open wizard with pre-selected vehicle from URL params
  useEffect(() => {
    const vehicleId = searchParams.get('vehicle_id');
    const vehicleName = searchParams.get('vehicle_name');
    
    if (vehicleId && vehicleName) {
      setVehicleContextId(vehicleId);
      setVehicleContextName(vehicleName);
      setWizardOpen(true);
      
      // Clear URL params after opening wizard
      searchParams.delete('vehicle_id');
      searchParams.delete('vehicle_name');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleEditAssignment = (assignment: any) => {
    console.log('Edit assignment clicked:', assignment);
    setEditingAssignment(assignment);
    setWizardOpen(true);
  };

  const handleViewAssignment = (assignment: any) => {
    console.log('View assignment clicked:', assignment);
    setViewingAssignment(assignment);
    setViewModalOpen(true);
  };

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("daily_vehicle_assignments")
        .delete()
        .eq("id", assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-vehicle-assignments"] });
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    }
  });

  const handleDeleteAssignment = (assignment: any) => {
    if (confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      deleteAssignmentMutation.mutate(assignment.id);
    }
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    setEditingAssignment(null);
    setVehicleContextId(null);
    setVehicleContextName(null);
  };

  return (
    <div className="space-y-6">
      {/* Main Content Card */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        {/* Header with Date Navigator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center justify-between w-full">
            {/* Left side - Title and Date Navigator */}
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Driver Assignments</h1>
                <p className="text-muted-foreground">Manage daily vehicle assignments for your drivers</p>
              </div>
              <div className="flex-shrink-0">
                <EnhancedDateNavigator
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  label="Assignment Date"
                />
              </div>
            </div>
            
            {/* Right side - Create Button */}
            <Button 
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6">
          <VehicleAssignmentsStats selectedDate={selectedDate} />
        </div>

        {/* Assignments Content */}
        <div className="mt-6">
          <VehicleAssignmentsContent 
            selectedDate={selectedDate} 
            onEditAssignment={handleEditAssignment}
            onViewAssignment={handleViewAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onCreateAssignment={() => setWizardOpen(true)}
          />
        </div>
      </div>

      {/* Assignment Creation/Edit Wizard */}
      <AssignmentCreationWizard
        open={wizardOpen}
        onOpenChange={handleCloseWizard}
        initialDate={selectedDate}
        editingAssignment={editingAssignment}
        vehicleContextId={vehicleContextId}
        vehicleContextName={vehicleContextName}
      />

      {/* Assignment View Modal */}
      <AssignmentViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        assignment={viewingAssignment}
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
  onViewAssignment,
  onDeleteAssignment,
  onCreateAssignment
}: { 
  selectedDate: Date; 
  onEditAssignment: (assignment: any) => void;
  onViewAssignment: (assignment: any) => void;
  onDeleteAssignment: (assignment: any) => void;
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
          .select("id, license_plate, vehicle_type, make, model, year, status, nickname")
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
        
        // Set driver status as "assigned" since they have an active assignment
        const driverWithStatus = profile ? {
          ...profile,
          status: "assigned"
        } : null;
        
        console.log(`Assignment ${assignment.id}:`, {
          vehicle_id: assignment.vehicle_id,
          driver_id: assignment.driver_id,
          found_vehicle: vehicle,
          found_profile: driverWithStatus
        });

        return {
          ...assignment,
          vehicles: vehicle,
          profiles: driverWithStatus
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
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium mb-2">No assignments for {format(selectedDate, "PPP")}</h3>
        <p className="text-sm mb-4">Create your first vehicle assignment for this date.</p>
        <Button onClick={onCreateAssignment} className="inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Assignment
        </Button>
      </div>
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
          <div key={assignment.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
            <div className="flex items-center justify-between">
                {/* Vehicle & Driver Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-blue rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {assignment.vehicles?.make && assignment.vehicles?.model ? 
                        `${assignment.vehicles.make} ${assignment.vehicles.model}${assignment.vehicles.nickname ? ` - ${assignment.vehicles.nickname}` : ''}` :
                        assignment.vehicles?.vehicle_type || "Unknown Vehicle"
                      }
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-blue-600 font-medium">{assignment.vehicles?.license_plate || "Unknown"}</span>
                      <span>•</span>
                      <Badge variant="outline" className="bg-transparent border-blue-500 text-blue-600 text-xs">
                        {getVehicleTypeDisplayName(assignment.vehicles?.vehicle_type) || 'Unknown type'}
                      </Badge>
                    </div>
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
                  
                  <AssignmentActionsMenu
                    assignment={assignment}
                    onView={onViewAssignment}
                    onEdit={onEditAssignment}
                    onDelete={onDeleteAssignment}
                  />
                </div>
              </div>

              {assignment.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{assignment.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }