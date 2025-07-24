
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Truck, 
  Edit, 
  Fuel,
  Wrench,
  Calendar,
  MapPin,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  status: string;
  current_mileage?: number;
  created_at: string;
  notes?: string;
}

interface VehicleDetailModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({ vehicle, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    license_plate: vehicle.license_plate,
    vehicle_type: vehicle.vehicle_type,
    make: vehicle.make || "",
    model: vehicle.model || "",
    year: vehicle.year || new Date().getFullYear(),
    vin: vehicle.vin || "",
    status: vehicle.status,
    current_mileage: vehicle.current_mileage || 0,
    notes: vehicle.notes || ""
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from("vehicles")
        .update(data)
        .eq("id", vehicle.id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsEditing(false);
      toast.success("Vehicle updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update vehicle");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicleMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "maintenance":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "retired":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{vehicle.license_plate}</DialogTitle>
                <p className="text-gray-600">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("badge-gradient", getStatusColor(vehicle.status))}>
                {vehicle.status}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="fuel">Fuel</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license_plate">License Plate</Label>
                    <Input
                      id="license_plate"
                      value={formData.license_plate}
                      onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle_type">Vehicle Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="trailer">Trailer</SelectItem>
                        <SelectItem value="pickup">Pickup Truck</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      min="1990"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vin">VIN</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="current_mileage">Current Mileage</Label>
                  <Input
                    id="current_mileage"
                    type="number"
                    value={formData.current_mileage}
                    onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateVehicleMutation.isPending}>
                    {updateVehicleMutation.isPending ? "Updating..." : "Update Vehicle"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Vehicle Image Placeholder */}
                <Card>
                  <CardContent className="p-6">
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center">
                        <Truck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Vehicle Photo</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Upload Photo
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-500">Make/Model</p>
                        <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Year</p>
                        <p className="font-semibold">{vehicle.year}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">VIN</p>
                        <p className="font-semibold">{vehicle.vin || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Mileage</p>
                        <p className="font-semibold">{vehicle.current_mileage?.toLocaleString() || "Unknown"} miles</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Added</p>
                      <p className="font-semibold">{format(new Date(vehicle.created_at), "MMM dd, yyyy")}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Wrench className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Last Service</p>
                      <p className="font-semibold">N/A</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">Unknown</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Maintenance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No maintenance records found</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fuel">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="w-5 h-5" />
                  Fuel Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No fuel logs found</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Daily Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No assignments found</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Compliance Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No documents found</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
