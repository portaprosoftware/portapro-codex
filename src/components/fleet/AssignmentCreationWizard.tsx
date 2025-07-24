import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { VehicleAvailabilityWidget } from "./VehicleAvailabilityWidget";
import { DriverAvailabilityWidget } from "./DriverAvailabilityWidget";
import { CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AssignmentCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
}

type Step = "date" | "vehicle" | "driver" | "details" | "review";

export const AssignmentCreationWizard: React.FC<AssignmentCreationWizardProps> = ({
  open,
  onOpenChange,
  initialDate = new Date()
}) => {
  const [currentStep, setCurrentStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [startMileage, setStartMileage] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("daily_vehicle_assignments")
        .insert({
          vehicle_id: selectedVehicle,
          driver_id: selectedDriver,
          assignment_date: format(selectedDate, "yyyy-MM-dd"),
          start_mileage: startMileage ? parseInt(startMileage) : null,
          notes: notes.trim() || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle assignment created successfully",
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
        description: "Failed to create assignment",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setCurrentStep("date");
    setSelectedDate(initialDate);
    setSelectedVehicle("");
    setSelectedDriver("");
    setStartMileage("");
    setNotes("");
  };

  const steps: { key: Step; title: string; description: string }[] = [
    { key: "date", title: "Select Date", description: "Choose the assignment date" },
    { key: "vehicle", title: "Choose Vehicle", description: "Select an available vehicle" },
    { key: "driver", title: "Assign Driver", description: "Choose a driver for the assignment" },
    { key: "details", title: "Assignment Details", description: "Add mileage and notes" },
    { key: "review", title: "Review & Create", description: "Confirm the assignment details" }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const canProceed = () => {
    switch (currentStep) {
      case "date": return selectedDate;
      case "vehicle": return selectedVehicle;
      case "driver": return selectedDriver;
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
      setCurrentStep(steps[nextStepIndex].key);
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
      case "date":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border mx-auto"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
          </div>
        );

      case "vehicle":
        return (
          <VehicleAvailabilityWidget
            selectedDate={selectedDate}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
            selectionMode
            className="h-full"
          />
        );

      case "driver":
        return (
          <DriverAvailabilityWidget
            selectedDate={selectedDate}
            selectedDriver={selectedDriver}
            onDriverSelect={setSelectedDriver}
            selectionMode
            className="h-full"
          />
        );

      case "details":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-mileage">Starting Mileage (Optional)</Label>
              <Input
                id="start-mileage"
                type="number"
                placeholder="Enter starting mileage"
                value={startMileage}
                onChange={(e) => setStartMileage(e.target.value)}
              />
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
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-accent/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-3">Assignment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground">{format(selectedDate, "PPP")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="text-foreground">{selectedVehicle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver:</span>
                    <span className="text-foreground">{selectedDriver}</span>
                  </div>
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
        side="right" 
        className="w-full sm:w-[50%] sm:max-w-none flex flex-col"
      >
        <SheetHeader className="pb-6">
          <SheetTitle>Create Vehicle Assignment</SheetTitle>
          <SheetDescription>
            {steps[currentStepIndex]?.description}
          </SheetDescription>
        </SheetHeader>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 pb-6">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
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
                  "flex-1 h-0.5 transition-colors",
                  index < currentStepIndex ? "bg-primary" : "bg-muted"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || createAssignmentMutation.isPending}
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
    </Sheet>
  );
};