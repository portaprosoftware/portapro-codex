
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssignmentCreationWizard } from "./AssignmentCreationWizard";
import { EnhancedDateNavigator } from "@/components/jobs/EnhancedDateNavigator";
import { Plus, User, Truck } from "lucide-react";
import { format } from "date-fns";

export const VehicleAssignments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <VehicleAssignmentsContent 
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
      />
    </div>
  );
};

const VehicleAssignmentsContent: React.FC<{
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
}> = ({ selectedDate, setSelectedDate, isWizardOpen, setIsWizardOpen }) => {

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["daily-vehicle-assignments", selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_vehicle_assignments")
        .select(`
          *,
          vehicles(license_plate, vehicle_type, make, model),
          profiles(first_name, last_name)
        `)
        .eq("assignment_date", dateStr)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: availableVehicles } = useQuery({
    queryKey: ["available-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "active")
        .order("license_plate");
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("first_name");
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Daily Vehicle Assignments</h3>
          <EnhancedDateNavigator
            date={selectedDate}
            onDateChange={setSelectedDate}
            label="Assignment Date"
          />
        </div>
        
        <Button onClick={() => setIsWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments?.map((assignment) => (
          <Card key={assignment.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {assignment.vehicles?.license_plate}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {assignment.vehicles?.make} {assignment.vehicles?.model} • {assignment.vehicles?.vehicle_type}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {assignment.profiles?.first_name} {assignment.profiles?.last_name}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  Start: {assignment.start_mileage || "Not recorded"}
                  {assignment.end_mileage && (
                    <span className="ml-2">End: {assignment.end_mileage}</span>
                  )}
                </div>
                
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>
            
            {assignment.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">{assignment.notes}</p>
              </div>
            )}
          </Card>
        ))}
        
        {assignments?.length === 0 && (
          <Card className="p-8 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments for this date</h3>
            <p className="text-gray-600 mb-4">Create vehicle assignments to track daily usage and mileage.</p>
            <Button onClick={() => setIsWizardOpen(true)}>Create Assignment</Button>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Total Vehicles</h4>
          <p className="text-2xl font-bold text-blue-600">{availableVehicles?.length || 0}</p>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Assigned Today</h4>
          <p className="text-2xl font-bold text-green-600">{assignments?.length || 0}</p>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">Available</h4>
          <p className="text-2xl font-bold text-gray-600">
            {(availableVehicles?.length || 0) - (assignments?.length || 0)}
          </p>
        </Card>
      </div>

      {/* Assignment Creation Wizard */}
      <AssignmentCreationWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        initialDate={selectedDate}
      />
    </div>
  );
};
