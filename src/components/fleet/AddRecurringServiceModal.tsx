import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Truck, Plus, Search, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaintenanceTaskSelector } from "./MaintenanceTaskSelector";

interface AddRecurringServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedVehicleId?: string;
}

export const AddRecurringServiceModal: React.FC<AddRecurringServiceModalProps> = ({
  open,
  onOpenChange,
  preselectedVehicleId = "",
}) => {
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");
  const [taskTypeName, setTaskTypeName] = useState("");
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleMiles, setVehicleMiles] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [intervalType, setIntervalType] = useState("days");
  const [intervalValue, setIntervalValue] = useState("");
  const [priority, setPriority] = useState("normal");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles-active-only"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "active")
        .order("license_plate", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: showVehicleModal,
  });

  // Effect to set preselected vehicle
  React.useEffect(() => {
    if (preselectedVehicleId && vehicles) {
      const preselectedVehicle = vehicles.find(v => v.id === preselectedVehicleId);
      if (preselectedVehicle) {
        setSelectedVehicle(preselectedVehicle);
        setVehicleId(preselectedVehicleId);
      }
    }
  }, [preselectedVehicleId, vehicles]);

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
        .order("name");
      if (error) throw error;
      return data;
    }
  });

  const createRecurringService = useMutation({
    mutationFn: async (serviceData: any) => {
      const { data, error } = await supabase
        .from("maintenance_records")
        .insert([serviceData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-maintenance"] });
      toast.success("Recurring service scheduled successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Error creating recurring service:", error);
      toast.error("Failed to schedule recurring service");
    }
  });

  const resetForm = () => {
    setVehicleId(preselectedVehicleId);
    setSelectedVehicle(null);
    setTaskTypeId("");
    setTaskTypeName("");
    setVendorId("");
    setDescription("");
    setVehicleMiles("");
    setStartDate(undefined);
    setIntervalType("days");
    setIntervalValue("");
    setPriority("normal");
    setEstimatedCost("");
    setNotes("");
  };

  const handleTaskSelect = (taskId: string, taskName: string) => {
    setTaskTypeId(taskId);
    setTaskTypeName(taskName);
    setShowTaskSelector(false);
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    (vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  const getVehicleImageUrl = (vehicle: any) => {
    if (!vehicle.vehicle_image) return null;
    if (vehicle.vehicle_image.startsWith('http')) return vehicle.vehicle_image;
    const { data } = supabase.storage.from('vehicle-images').getPublicUrl(vehicle.vehicle_image);
    return data.publicUrl;
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setVehicleId(vehicle.id);
    setVehicleMiles(vehicle.current_mileage?.toString() || '');
    setShowVehicleModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleId || !startDate || !estimatedCost || !intervalType || !intervalValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    let finalTaskTypeId = null;
    if (taskTypeName && taskTypes) {
      const foundTaskType = taskTypes.find(type => 
        type.name.toLowerCase() === taskTypeName.toLowerCase()
      );
      if (foundTaskType) {
        finalTaskTypeId = foundTaskType.id;
      }
    } else if (taskTypeId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(taskTypeId)) {
        finalTaskTypeId = taskTypeId;
      }
    }

    const notificationTriggerType = intervalType === "miles" ? "mileage_based" : "date_based";
    
    let nextServiceDate = null;
    let nextServiceMileage = null;
    
    if (intervalType === "miles") {
      const currentMileage = vehicleMiles ? parseInt(vehicleMiles) : 0;
      nextServiceMileage = currentMileage + parseInt(intervalValue);
    } else {
      const intervalDays = intervalType === "days" ? parseInt(intervalValue) : 
                          intervalType === "weeks" ? parseInt(intervalValue) * 7 :
                          parseInt(intervalValue) * 30;
      nextServiceDate = new Date(startDate.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const serviceData = {
      vehicle_id: vehicleId,
      task_type_id: finalTaskTypeId,
      vendor_id: vendorId === "internal" || vendorId === "" ? null : vendorId,
      description: description || taskTypeName || "General Maintenance",
      maintenance_type: taskTypeName || description || "General Maintenance",
      scheduled_date: startDate.toISOString().split('T')[0],
      priority,
      cost: parseFloat(estimatedCost),
      mileage_at_service: vehicleMiles ? parseInt(vehicleMiles) : null,
      notes,
      status: "scheduled",
      notification_trigger_type: notificationTriggerType,
      next_service_date: nextServiceDate,
      next_service_mileage: nextServiceMileage
    };

    createRecurringService.mutate(serviceData);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Schedule Recurring Service</DialogTitle>
            <DialogDescription>
              Set up recurring maintenance for a vehicle.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle *</Label>
                {selectedVehicle ? (
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Truck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedVehicle.license_plate || `Vehicle ${selectedVehicle.id.slice(0, 8)}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowVehicleModal(true)}
                        >
                          Change
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-dashed border-2 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => setShowVehicleModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Select Vehicle
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskType">Task Type</Label>
                {taskTypeName ? (
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{taskTypeName}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTaskSelector(true)}
                        >
                          Change
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-dashed border-2 hover:border-blue-300 hover:bg-blue-50"
                    onClick={() => setShowTaskSelector(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Select Task Type
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Oil change, brake inspection..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleMiles">Vehicle Miles</Label>
                <Input
                  id="vehicleMiles"
                  type="number"
                  placeholder="Current odometer reading"
                  value={vehicleMiles}
                  onChange={(e) => setVehicleMiles(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Interval Type *</Label>
                <Select value={intervalType} onValueChange={setIntervalType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="miles">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Interval Value *</Label>
                <Input
                  type="number"
                  placeholder="e.g., 30, 5000"
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Provider</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">In-house / Internal</SelectItem>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes or instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRecurringService.isPending}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {createRecurringService.isPending ? "Scheduling..." : "Schedule Recurring Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vehicle Selection Modal */}
      <Dialog open={showVehicleModal} onOpenChange={setShowVehicleModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by license plate, make, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {vehiclesLoading ? (
                <p className="text-center text-gray-500 py-8">Loading vehicles...</p>
              ) : filteredVehicles.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No vehicles found</p>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    className="cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {getVehicleImageUrl(vehicle) ? (
                          <img
                            src={getVehicleImageUrl(vehicle)!}
                            alt={vehicle.license_plate}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Truck className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{vehicle.license_plate}</p>
                          <p className="text-sm text-gray-600">
                            {vehicle.make} {vehicle.model} {vehicle.year}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {vehicle.vehicle_type}
                            </Badge>
                            {vehicle.status && (
                              <Badge className="text-xs bg-green-100 text-green-800">
                                {vehicle.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Type Selector */}
      <MaintenanceTaskSelector
        open={showTaskSelector}
        onOpenChange={setShowTaskSelector}
        onTaskSelect={handleTaskSelect}
      />
    </>
  );
};