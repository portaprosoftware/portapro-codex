import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Truck, User, Calendar, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AssignmentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
}

export const AssignmentEditModal: React.FC<AssignmentEditModalProps> = ({
  open,
  onOpenChange,
  assignment,
}) => {
  const [startMileage, setStartMileage] = useState<string>("");
  const [endMileage, setEndMileage] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form values when assignment changes
  useEffect(() => {
    if (assignment) {
      setStartMileage(assignment.start_mileage?.toString() || "");
      setEndMileage(assignment.end_mileage?.toString() || "");
      setNotes(assignment.notes || "");
    }
  }, [assignment]);

  const updateAssignmentMutation = useMutation({
    mutationFn: async () => {
      const updateData: any = {
        notes: notes.trim() || null,
      };

      // Only update mileage if values are provided
      if (startMileage.trim()) {
        updateData.start_mileage = parseInt(startMileage);
      }
      if (endMileage.trim()) {
        updateData.end_mileage = parseInt(endMileage);
      }

      const { error } = await supabase
        .from("daily_vehicle_assignments")
        .update(updateData)
        .eq("id", assignment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Assignment updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["daily-vehicle-assignments"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      });
      console.error("Update assignment error:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAssignmentMutation.mutate();
  };

  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Assignment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assignment Info */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">
                {format(new Date(assignment.assignment_date), "PPP")}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Vehicle:</span>
              <span className="font-medium">
                {assignment.vehicles?.license_plate || "Unknown Vehicle"}
              </span>
              {assignment.vehicles && (
                <Badge variant="outline" className="text-xs">
                  {assignment.vehicles.vehicle_type?.toUpperCase()}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Driver:</span>
              <span className="font-medium">
                {assignment.profiles?.first_name && assignment.profiles?.last_name
                  ? `${assignment.profiles.first_name} ${assignment.profiles.last_name}`
                  : "Driver not found"}
              </span>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-mileage">Starting Mileage</Label>
                <Input
                  id="start-mileage"
                  type="number"
                  placeholder="Enter starting mileage"
                  value={startMileage}
                  onChange={(e) => setStartMileage(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-mileage">Ending Mileage</Label>
                <Input
                  id="end-mileage"
                  type="number"
                  placeholder="Enter ending mileage"
                  value={endMileage}
                  onChange={(e) => setEndMileage(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes for this assignment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateAssignmentMutation.isPending}
            >
              {updateAssignmentMutation.isPending ? "Updating..." : "Update Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};