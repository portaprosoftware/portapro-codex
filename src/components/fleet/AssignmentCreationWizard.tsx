import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StockVehicleSelectionModal } from "./StockVehicleSelectionModal";
import { DriverSelectionModal } from "./DriverSelectionModal";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Truck, User, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AssignmentCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  editingAssignment?: any;
}

type Step = "basics" | "details" | "review";

export const AssignmentCreationWizard: React.FC<AssignmentCreationWizardProps> = ({
  open,
  onOpenChange,
  initialDate = new Date(),
  editingAssignment
}) => {
  const [currentStep, setCurrentStep] = useState<Step>("basics");
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [startMileage, setStartMileage] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [driverModalOpen, setDriverModalOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEditMode = !!editingAssignment;

  // Populate form when editing
  React.useEffect(() => {
    if (editingAssignment) {
      // Fix date initialization to avoid timezone issues
      const assignmentDate = new Date(editingAssignment.assignment_date + 'T00:00:00');
      setSelectedDate(assignmentDate);
      setSelectedVehicle(editingAssignment.vehicles);
      const driverProfile = editingAssignment.profiles;
      setSelectedDriver({ ...driverProfile, status: "assigned" });
      setNotes(editingAssignment.notes || "");
    }
  }, [editingAssignment]);

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (isEditMode) {
        // Update existing assignment
        const updateData: any = {
          vehicle_id: selectedVehicle?.id,
          driver_id: selectedDriver?.id || selectedDriver?.clerk_user_id,
          assignment_date: format(selectedDate, "yyyy-MM-dd"),
          start_mileage: startMileage ? parseInt(startMileage) : null,
          notes: notes.trim() || null
        };

        const { error } = await supabase
          .from("daily_vehicle_assignments")
          .update(updateData)
          .eq("id", editingAssignment.id);

        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from("daily_vehicle_assignments")
          .insert({
            vehicle_id: selectedVehicle?.id,
            driver_id: selectedDriver?.id || selectedDriver?.clerk_user_id,
            assignment_date: format(selectedDate, "yyyy-MM-dd"),
            start_mileage: startMileage ? parseInt(startMileage) : null,
            notes: notes.trim() || null
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditMode ? "Assignment updated successfully" : "Vehicle assignment created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["daily-vehicle-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["driver-assignments"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update assignment" : "Failed to create assignment",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setCurrentStep("basics");
    setSelectedDate(initialDate);
    setSelectedVehicle(null);
    setSelectedDriver(null);
    setStartMileage("");
    setNotes("");
  };

  const steps: { key: Step; title: string; description: string }[] = [
    { key: "basics", title: isEditMode ? "Edit Assignment" : "Assignment Basics", description: isEditMode ? "Update vehicle and driver details" : "Choose date, vehicle, and driver" },
    { key: "details", title: "Assignment Details", description: "Add mileage and notes" },
    { key: "review", title: isEditMode ? "Review Changes" : "Review & Create", description: isEditMode ? "Confirm the updated assignment" : "Confirm the assignment details" }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const canProceed = () => {
    switch (currentStep) {
      case "basics": return selectedDate && selectedVehicle && selectedDriver;
      case "details": return true; // Optional fields
      case "review": return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      createAssignmentMutation.mutate();
    } else {
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = steps[nextStepIndex].key;
      
      // Auto-populate starting mileage when moving to details step
      if (nextStep === "details" && selectedVehicle?.current_mileage && !startMileage) {
        setStartMileage(selectedVehicle.current_mileage.toString());
      }
      
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStepIndex = currentStepIndex - 1;
      setCurrentStep(steps[prevStepIndex].key);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "basics":
        return (
          <div className="space-y-6">
            {/* Grid layout - side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-20">
              {/* Date Selection */}
              <div className="flex flex-col space-y-4">
                <div className="text-center h-16 flex flex-col justify-center">
                  <h3 className="text-base font-semibold mb-2">Assignment Date</h3>
                  <p className="text-sm text-muted-foreground">Select a date for this assignment</p>
                </div>
                <div className="flex justify-center flex-1">
                  <div className="w-fit">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-lg border shadow-sm pointer-events-auto scale-90 lg:scale-100"
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day: "h-9 w-9 text-center text-sm p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="flex flex-col space-y-4">
                <div className="text-center h-16 flex flex-col justify-center">
                  <h3 className="text-base font-semibold mb-2">Select Vehicle</h3>
                  <p className="text-sm text-muted-foreground">Choose an available vehicle</p>
                </div>
                
                <div className="flex-1 flex items-start justify-center pt-4">
                  {!selectedVehicle && (
                    <div className="text-center py-4 w-full">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Truck className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">No vehicle selected</p>
                      <Button onClick={() => setVehicleModalOpen(true)} size="sm" className="text-xs">
                        <Plus className="h-4 w-4 mr-1" />
                        Select Vehicle
                      </Button>
                    </div>
                  )}
                  {selectedVehicle && (
                    <div className="text-center py-4 w-full">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                        <Check className="h-6 w-6 text-white font-bold stroke-[3]" />
                      </div>
                      <p className="text-sm font-medium mb-2">Vehicle Selected</p>
                      <p className="text-xs text-muted-foreground mb-3">Selection details below</p>
                      <Button onClick={() => setVehicleModalOpen(true)} variant="outline" size="sm" className="text-xs">
                        Change Vehicle
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Selection */}
              <div className="flex flex-col space-y-4">
                <div className="text-center h-16 flex flex-col justify-center">
                  <h3 className="text-base font-semibold mb-2">Select Driver</h3>
                  <p className="text-sm text-muted-foreground">Choose a driver for this assignment</p>
                </div>
                
                <div className="flex-1 flex items-start justify-center pt-4">
                  {!selectedDriver && (
                    <div className="text-center py-4 w-full">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">No driver selected</p>
                      <Button onClick={() => setDriverModalOpen(true)} size="sm" className="text-xs">
                        <Plus className="h-4 w-4 mr-1" />
                        Select Driver
                      </Button>
                    </div>
                  )}
                  {selectedDriver && (
                    <div className="text-center py-4 w-full">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                        <Check className="h-6 w-6 text-white font-bold stroke-[3]" />
                      </div>
                      <p className="text-sm font-medium mb-2">Driver Selected</p>
                      <p className="text-xs text-muted-foreground mb-3">Selection details below</p>
                      <Button onClick={() => setDriverModalOpen(true)} variant="outline" size="sm" className="text-xs">
                        Change Driver
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Items Display at Bottom */}
            {(selectedVehicle || selectedDriver) && (
              <div className="mt-8 pt-6 border-t">
                <h4 className="text-sm font-semibold text-center mb-4">Selected Items</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Selected Vehicle Card */}
                  {selectedVehicle && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Truck className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-sm">{selectedVehicle.license_plate}</h5>
                            <p className="text-xs text-muted-foreground truncate">
                              {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                            </p>
                            <div className="mt-1">
                              <span className="inline-flex items-center rounded-md bg-muted border px-2 py-1 text-xs font-bold text-foreground shadow-sm">
                                {selectedVehicle.vehicle_type.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Driver Card */}
                  {selectedDriver && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm">
                              {`${selectedDriver.first_name?.[0] || ''}${selectedDriver.last_name?.[0] || ''}`.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-sm">
                              {selectedDriver.first_name} {selectedDriver.last_name}
                            </h5>
                            <div className="flex items-center space-x-1 mt-1">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold text-white shadow-sm ${
                                selectedDriver.status === "available" 
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : selectedDriver.status === "assigned"
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                  : "bg-gradient-to-r from-red-500 to-red-600"
                              }`}>
                                {selectedDriver.status === "available" ? "Available" : 
                                 selectedDriver.status === "assigned" ? "Assigned" : "Off-Duty"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Required Fields Notice */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                  !
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">All fields required</p>
                  <p className="text-sm text-muted-foreground">Please select a date, vehicle, and driver to continue.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "details":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Assignment Details</h3>
              <p className="text-sm text-muted-foreground">Add optional mileage and notes for this assignment</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-mileage">Starting Mileage (Optional)</Label>
                <Input
                  id="start-mileage"
                  type="number"
                  placeholder={selectedVehicle?.current_mileage ? `Current: ${selectedVehicle.current_mileage}` : "Enter starting mileage"}
                  value={startMileage}
                  onChange={(e) => setStartMileage(e.target.value)}
                />
                {selectedVehicle?.current_mileage && (
                  <p className="text-xs text-muted-foreground">
                    Vehicle's current mileage: {selectedVehicle.current_mileage.toLocaleString()} miles
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes for this assignment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Review Assignment</h3>
              <p className="text-sm text-muted-foreground">Please review all details before creating the assignment</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-accent/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-3">Assignment Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground">{format(selectedDate, "PPP")}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              {selectedVehicle && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-3">Vehicle Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License Plate:</span>
                      <span className="text-foreground font-medium">{selectedVehicle.license_plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="text-foreground">{selectedVehicle.year || ''} {selectedVehicle.make} {selectedVehicle.model}</span>
                    </div>
                    {selectedVehicle.nickname && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nickname:</span>
                        <span className="text-foreground">"{selectedVehicle.nickname}"</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-foreground">{selectedVehicle.vehicle_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-foreground capitalize">{selectedVehicle.status}</span>
                    </div>
                    {selectedVehicle.current_mileage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Mileage:</span>
                        <span className="text-foreground">{selectedVehicle.current_mileage.toLocaleString()} mi</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Driver Details */}
              {selectedDriver && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-3">Driver Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Driver:</span>
                      <span className="text-foreground font-medium">{selectedDriver.first_name} {selectedDriver.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-foreground capitalize">{selectedDriver.availability_status || 'Available'}</span>
                    </div>
                    {selectedDriver.working_hours && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Working Hours:</span>
                        <span className="text-foreground">{selectedDriver.working_hours}</span>
                      </div>
                    )}
                    {selectedDriver.scheduled_jobs && selectedDriver.scheduled_jobs.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Scheduled Jobs:</span>
                        <div className="mt-1 space-y-1">
                          {selectedDriver.scheduled_jobs.map((job: any, index: number) => (
                            <div key={index} className="text-xs bg-background/50 p-2 rounded">
                              <div className="flex justify-between">
                                <span>{job.scheduled_time}</span>
                                <span className="text-muted-foreground">{job.job_type}</span>
                              </div>
                              <div className="text-muted-foreground">{job.customer_name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assignment Details */}
              {(startMileage || notes) && (
                <div className="p-4 bg-accent/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-3">Assignment Details</h4>
                  <div className="space-y-2 text-sm">
                    {startMileage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting Mileage:</span>
                        <span className="text-foreground">{parseInt(startMileage).toLocaleString()} mi</span>
                      </div>
                    )}
                    {notes && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Notes:</span>
                        <span className="text-foreground">{notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] w-full max-w-none flex flex-col rounded-t-2xl border-t"
      >
        <SheetHeader className="pb-6 border-b">
          <div>
            <SheetTitle className="text-xl">Create Vehicle Assignment</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground mt-1">
              {steps[currentStepIndex]?.description}
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 py-4 overflow-x-auto">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center flex-shrink-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                index <= currentStepIndex 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              )}>
                {index < currentStepIndex ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 transition-colors mx-2",
                  index < currentStepIndex ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-1">
          <div className="max-w-2xl mx-auto">
            {renderStepContent()}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t bg-background">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="min-w-[100px]"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || createAssignmentMutation.isPending}
            className={`min-w-[140px] ${isLastStep ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-0" : "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0"}`}
          >
            {isLastStep ? (
              createAssignmentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Assignment
                </>
              )
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </SheetContent>

      {/* Vehicle Selection Modal */}
      <StockVehicleSelectionModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        selectedDate={selectedDate}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={setSelectedVehicle}
      />

      {/* Driver Selection Modal */}
      <DriverSelectionModal
        open={driverModalOpen}
        onOpenChange={setDriverModalOpen}
        selectedDate={selectedDate}
        selectedDriver={selectedDriver}
        onDriverSelect={setSelectedDriver}
      />
    </Sheet>
  );
};