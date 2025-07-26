import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddMaintenanceRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddMaintenanceRecordModal: React.FC<AddMaintenanceRecordModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [vehicleId, setVehicleId] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [priority, setPriority] = useState("medium");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, vehicle_type")
        .eq("status", "active");
      if (error) throw error;
      return data;
    }
  });

  // Fetch task types
  const { data: taskTypes } = useQuery({
    queryKey: ["maintenance-task-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_task_types")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    }
  });

  // Fetch vendors
  const { data: vendors } = useQuery({
    queryKey: ["maintenance-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_vendors")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    }
  });

  const createMaintenanceRecord = useMutation({
    mutationFn: async (recordData: any) => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .insert([recordData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success("Maintenance record created successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Error creating maintenance record:", error);
      toast.error("Failed to create maintenance record");
    }
  });

  const resetForm = () => {
    setVehicleId("");
    setTaskTypeId("");
    setVendorId("");
    setDescription("");
    setScheduledDate(undefined);
    setPriority("medium");
    setEstimatedCost("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleId || !description || !scheduledDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const recordData = {
      vehicle_id: vehicleId,
      task_type_id: taskTypeId || null,
      vendor_id: vendorId || null,
      description,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      priority,
      cost: estimatedCost ? parseFloat(estimatedCost) : null,
      notes,
      status: "scheduled",
      maintenance_type: description
    };

    createMaintenanceRecord.mutate(recordData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Maintenance Record</DialogTitle>
          <DialogDescription>
            Schedule a new maintenance task for a vehicle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select value={vehicleId} onValueChange={setVehicleId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.vehicle_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type</Label>
              <Select value={taskTypeId} onValueChange={setTaskTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes?.map((taskType) => (
                    <SelectItem key={taskType.id} value={taskType.id}>
                      {taskType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Service Provider</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Oil change, brake inspection..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scheduled Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost</Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or instructions..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMaintenanceRecord.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {createMaintenanceRecord.isPending ? "Creating..." : "Create Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};