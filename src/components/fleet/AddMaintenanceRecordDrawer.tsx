import React, { useState } from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Truck, Plus, Search, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaintenanceTaskSelector } from "./MaintenanceTaskSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddMaintenanceRecordDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedVehicleId?: string;
}

export const AddMaintenanceRecordDrawer: React.FC<AddMaintenanceRecordDrawerProps> = ({
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
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [priority, setPriority] = useState("medium");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("status", "available")
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
    setVehicleId(preselectedVehicleId);
    setSelectedVehicle(null);
    setTaskTypeId("");
    setTaskTypeName("");
    setVendorId("");
    setDescription("");
    setVehicleMiles("");
    setScheduledDate(undefined);
    setPriority("medium");
    setEstimatedCost("");
    setNotes("");
  };

  const handleTaskSelect = (taskId: string, taskName: string) => {
    setTaskTypeId(taskId);
    setTaskTypeName(taskName);
    setShowTaskSelector(false);
  };

  // Filter vehicles based on search term
  const filteredVehicles = vehicles.filter(vehicle =>
    (vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

  // Helper function to get the proper image URL from Supabase storage
  const getVehicleImageUrl = (vehicle: any) => {
    if (!vehicle.vehicle_image) return null;
    // If it's already a full URL, return as is
    if (vehicle.vehicle_image.startsWith('http')) return vehicle.vehicle_image;
    // Otherwise, use Supabase storage API to get the public URL
    const { data } = supabase.storage.from('vehicle-images').getPublicUrl(vehicle.vehicle_image);
    return data.publicUrl;
  };

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setVehicleId(vehicle.id);
    setShowVehicleModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicleId || !scheduledDate || !estimatedCost) {
      toast.error("Please fill in all required fields (Vehicle, Date, and Cost)");
      return;
    }

    const recordData = {
      vehicle_id: vehicleId,
      task_type_id: taskTypeId || null,
      vendor_id: vendorId || null,
      description: description || null,
      vehicle_miles: vehicleMiles ? parseInt(vehicleMiles) : null,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      priority,
      cost: parseFloat(estimatedCost),
      notes,
      status: "scheduled",
      maintenance_type: taskTypeName || description || "General Maintenance"
    };

    createMaintenanceRecord.mutate(recordData);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Create Maintenance Record</DrawerTitle>
          <DrawerDescription>
            Schedule a new maintenance task for a vehicle.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1 space-y-6">
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Oil change, brake inspection..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleMiles">Vehicle Miles</Label>
                <Input
                  id="vehicleMiles"
                  type="number"
                  value={vehicleMiles}
                  onChange={(e) => setVehicleMiles(e.target.value)}
                  placeholder="Current odometer reading"
                />
              </div>
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
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Cost *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="estimatedCost"
                    type="number"
                    step="0.01"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
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
          </form>
        </div>

        <DrawerFooter>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMaintenanceRecord.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {createMaintenanceRecord.isPending ? "Creating..." : "Create Record"}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>

      {/* Vehicle Selection Modal */}
      <Dialog open={showVehicleModal} onOpenChange={setShowVehicleModal}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Select Vehicle for Maintenance
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by license plate, vehicle type, make or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Loading State */}
            {vehiclesLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading vehicles...</p>
              </div>
            )}

            {/* Vehicle Grid */}
            {!vehiclesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 max-h-96">
                {filteredVehicles.map((vehicle: any) => (
                  <Card
                    key={vehicle.id}
                    className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                      selectedVehicle?.id === vehicle.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col">
                        {/* Vehicle Image */}
                        <div className="relative h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg overflow-hidden">
                          {getVehicleImageUrl(vehicle) ? (
                            <img 
                              src={getVehicleImageUrl(vehicle)!} 
                              alt={`${vehicle.license_plate} vehicle`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`${getVehicleImageUrl(vehicle) ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                            <Truck className="h-8 w-8 text-blue-600" />
                          </div>
                          {selectedVehicle?.id === vehicle.id && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-500 text-white font-bold border-0 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Selected
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Vehicle Details */}
                        <div className="p-4 space-y-2">
                          <h4 className="font-bold text-lg text-gray-900">
                            {vehicle.license_plate || `Vehicle ${vehicle.id.slice(0, 8)}`}
                          </h4>
                          
                          {(vehicle.make || vehicle.model || vehicle.year) && (
                            <div className="space-y-1">
                              <span className="text-sm text-gray-600 font-medium">Make/Model:</span>
                              <p className="text-sm text-gray-900 leading-tight">
                                {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')}
                              </p>
                            </div>
                          )}
                          
                          {vehicle.vehicle_type && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 font-medium">Type:</span>
                              <span className="text-sm text-gray-900 capitalize">{vehicle.vehicle_type}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Status:</span>
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Available
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Results */}
            {!vehiclesLoading && filteredVehicles.length === 0 && vehicles.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No vehicles found matching your search.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm("")}
                  className="mt-2"
                >
                  Clear Search
                </Button>
              </div>
            )}

            {/* No Vehicles Available */}
            {!vehiclesLoading && vehicles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No vehicles available for maintenance.</p>
                <p className="text-sm mt-1">Please add vehicles to your fleet first.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center gap-2 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} available
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowVehicleModal(false)}>
                Cancel
              </Button>
              {selectedVehicle && (
                <Button onClick={() => handleVehicleSelect(selectedVehicle)}>
                  Confirm Selection
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maintenance Task Selector Modal */}
      <MaintenanceTaskSelector
        open={showTaskSelector}
        onOpenChange={setShowTaskSelector}
        onTaskSelect={handleTaskSelect}
        selectedTaskId={taskTypeId}
      />
    </Drawer>
  );
};
