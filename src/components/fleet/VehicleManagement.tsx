import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Plus, 
  Edit, 
  FileText, 
  Calendar as CalendarIcon,
  Fuel,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
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
  last_known_location?: any;
  current_mileage?: number;
  created_at: string;
  notes?: string;
}

export const VehicleManagement = ({ selectedVehicle, onBack }: { selectedVehicle?: Vehicle | null; onBack?: () => void }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (vehicleData: any) => {
      const { data, error } = await supabase
        .from("vehicles")
        .insert(vehicleData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setShowCreateModal(false);
      toast.success("Vehicle created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create vehicle");
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, ...vehicleData }: { id: string } & {
      license_plate?: string;
      vehicle_type?: string;
      make?: string;
      model?: string;
      year?: number;
      vin?: string;
      status?: string;
      current_mileage?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("vehicles")
        .update(vehicleData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setEditingVehicle(null);
      toast.success("Vehicle updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update vehicle");
    }
  });

  const VehicleForm = ({ vehicle, onSubmit, onCancel }: {
    vehicle?: Vehicle | null;
    onSubmit: (data: {
      license_plate: string;
      vehicle_type: string;
      make?: string;
      model?: string;
      year?: number;
      vin?: string;
      status: string;
      current_mileage?: number;
      notes?: string;
    }) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      license_plate: vehicle?.license_plate || "",
      vehicle_type: vehicle?.vehicle_type || "",
      make: vehicle?.make || "",
      model: vehicle?.model || "",
      year: vehicle?.year || new Date().getFullYear(),
      vin: vehicle?.vin || "",
      status: vehicle?.status || "active",
      current_mileage: vehicle?.current_mileage || 0,
      notes: vehicle?.notes || ""
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="license_plate">License Plate *</Label>
            <Input
              id="license_plate"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              placeholder="ABC-123"
              required
            />
          </div>
          <div>
            <Label htmlFor="vehicle_type">Vehicle Type *</Label>
            <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
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
              placeholder="Ford"
            />
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="F-150"
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
              placeholder="1HGBH41JXMN109186"
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
            placeholder="0"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes about this vehicle..."
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending}>
            {vehicle ? "Update" : "Create"} Vehicle
          </Button>
        </div>
      </form>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "maintenance":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold border-0";
      case "retired":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← Back to Overview
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Vehicle Management</h1>
            <p className="text-muted-foreground">Manage your fleet vehicles</p>
          </div>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
            </DialogHeader>
            <VehicleForm
              onSubmit={(data) => createVehicleMutation.mutate(data)}
              onCancel={() => setShowCreateModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Tracking</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles?.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">{vehicle.license_plate}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {vehicle.vehicle_type}
                    </p>
                  </div>
                  
                  {vehicle.current_mileage && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3 mr-1" />
                      {vehicle.current_mileage.toLocaleString()} miles
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingVehicle(vehicle)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Added {format(new Date(vehicle.created_at), "MMM dd, yyyy")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {vehicles?.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first vehicle to the fleet.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <p>Maintenance scheduling coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Fuel className="w-12 h-12 mx-auto mb-4" />
                <p>Fuel tracking dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>Compliance management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Vehicle Modal */}
      <Dialog open={!!editingVehicle} onOpenChange={() => setEditingVehicle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vehicle: {editingVehicle?.license_plate}</DialogTitle>
          </DialogHeader>
          {editingVehicle && (
            <VehicleForm
              vehicle={editingVehicle}
              onSubmit={(data) => updateVehicleMutation.mutate({ ...data, id: editingVehicle.id })}
              onCancel={() => setEditingVehicle(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};