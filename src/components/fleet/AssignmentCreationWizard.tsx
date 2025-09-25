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

  // Edit mode detection
  const isEditMode = !!editingAssignment;

  // Populate form when editing
  React.useEffect(() => {
    if (editingAssignment) {
      setSelectedDate(new Date(editingAssignment.assignment_date));
      setSelectedVehicle(editingAssignment.vehicle);
      setSelectedDriver(editingAssignment.driver);
      setStartMileage(editingAssignment.start_mileage?.toString() || "");
      setNotes(editingAssignment.notes || "");
    }
  }, [editingAssignment]);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        resetForm();
      }, 300);
    } else if (open && !editingAssignment) {
      resetForm();
      setSelectedDate(initialDate);
    }
  }, [open, editingAssignment, initialDate]);

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      const assignmentData = {
        assignment_date: selectedDate.toISOString().split('T')[0],
        vehicle_id: selectedVehicle.id,
        driver_id: selectedDriver.id,
        start_mileage: startMileage ? parseInt(startMileage) : null,
        notes: notes || null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("daily_vehicle_assignments")
          .update(assignmentData)
          .eq("id", editingAssignment.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("daily_vehicle_assignments")
          .insert([assignmentData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-vehicle-assignments"] });
      toast({
        title: "Success",
        description: isEditMode ? "Assignment updated successfully" : "Assignment created successfully",
      });
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
          <div className="flex gap-6 h-full">
            {/* Left Side - Calendar (moved 10% right) */}
            <div className="flex-shrink-0 ml-[10%]">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-base font-semibold mb-2">Assignment Date</h3>
                  <p className="text-sm text-muted-foreground">Select a date for this assignment</p>
                </div>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-lg border shadow-sm pointer-events-auto"
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

            {/* Middle - Vehicle and Driver Selection */}
            <div className="flex-1 px-6">
              <div className="space-y-8">
                {/* Vehicle Selection */}
                <div className="flex flex-col space-y-4">
                  <div className="text-center">
                    <h3 className="text-base font-semibold mb-2">Vehicle</h3>
                    <p className="text-sm text-muted-foreground">Choose an available vehicle</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    {!selectedVehicle ? (
                      <Button onClick={() => setVehicleModalOpen(true)} size="default" className="w-full max-w-xs">
                        <Truck className="h-4 w-4 mr-2" />
                        Select Vehicle
                      </Button>
                    ) : (
                      <Button onClick={() => setVehicleModalOpen(true)} variant="outline" size="default" className="w-full max-w-xs">
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Change Vehicle
                      </Button>
                    )}
                  </div>
                </div>

                {/* Driver Selection */}
                <div className="flex flex-col space-y-4">
                  <div className="text-center">
                    <h3 className="text-base font-semibold mb-2">Driver</h3>
                    <p className="text-sm text-muted-foreground">Choose a driver for assignment</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    {!selectedDriver ? (
                      <Button onClick={() => setDriverModalOpen(true)} size="default" className="w-full max-w-xs">
                        <User className="h-4 w-4 mr-2" />
                        Select Driver
                      </Button>
                    ) : (
                      <Button onClick={() => setDriverModalOpen(true)} variant="outline" size="default" className="w-full max-w-xs">
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                        Change Driver
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Selected Items (25% width, moved 10% left) */}
            <div className="w-1/4 flex-shrink-0 mr-[10%]">
              <div className="bg-muted/30 rounded-lg p-4 h-full">
                <h4 className="text-base font-semibold mb-4">Selected Items</h4>
                
                <div className="space-y-3">
                  {/* Selected Vehicle Card */}
                  {selectedVehicle ? (
                    <div className="p-3 border rounded-lg bg-white">
                      <div className="flex items-start space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-sm">{selectedVehicle.license_plate}</h5>
                          <p className="text-xs text-muted-foreground truncate">
                            {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                          </p>
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-md bg-muted border px-2 py-1 text-xs font-bold text-foreground shadow-sm">
                              {selectedVehicle.vehicle_type?.toUpperCase() || 'TRUCK'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center">
                      <Truck className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">No vehicle selected</p>
                    </div>
                  )}

                  {/* Selected Driver Card */}
                  {selectedDriver ? (
                    <div className="p-3 border rounded-lg bg-white">
                      <div className="flex items-start space-x-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs">
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
                  ) : (
                    <div className="p-3 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center">
                      <User className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">No driver selected</p>
                    </div>
                  )}
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
              <p className="text-muted-foreground">Add optional mileage and notes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="space-y-2">
                <Label htmlFor="start-mileage">Starting Mileage (Optional)</Label>
                <Input
                  id="start-mileage"
                  type="number"
                  placeholder="Enter starting mileage"
                  value={startMileage}
                  onChange={(e) => setStartMileage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Current vehicle mileage will be used if available
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
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
              <p className="text-muted-foreground">
                {isEditMode ? "Confirm the changes to this assignment" : "Review the assignment details before creating"}
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              {/* Assignment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Assignment Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Date:</strong> {format(selectedDate, "PPP")}
                      </span>
                    </div>
                    {startMileage && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          <strong>Starting Mileage:</strong> {startMileage}
                        </span>
                      </div>
                    )}
                    {notes && (
                      <div className="space-y-1">
                        <strong className="text-sm">Notes:</strong>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Items */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Assigned Resources</h4>
                  
                  {/* Vehicle */}
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h6 className="font-medium text-sm">{selectedVehicle?.license_plate}</h6>
                        <p className="text-xs text-muted-foreground">
                          {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Driver */}
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs">
                          {`${selectedDriver?.first_name?.[0] || ''}${selectedDriver?.last_name?.[0] || ''}`.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h6 className="font-medium text-sm">
                          {selectedDriver?.first_name} {selectedDriver?.last_name}
                        </h6>
                        <p className="text-xs text-muted-foreground">Driver</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
        className="h-[90vh] w-full max-w-none flex flex-col rounded-t-2xl border-t"
      >
        <SheetHeader className="pb-6 border-b">
          <div>
            <SheetTitle className="text-xl">Create Vehicle Assignment</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground mt-1">
              {steps[currentStepIndex]?.description}
            </SheetDescription>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    index <= currentStepIndex
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                <span className={cn(
                  "ml-2 text-sm transition-colors",
                  index === currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </SheetHeader>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-1">
          {renderStepContent()}
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

          {/* Required Fields Notice for Step 1 */}
          {currentStep === "basics" && !canProceed() && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                !
              </div>
              <span>All fields required</span>
            </div>
          )}

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
                  {isEditMode ? "Update Assignment" : "Create Assignment"}
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