import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Settings, Truck, Package, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
}

interface VehicleCapacity {
  id: string;
  vehicle_id: string;
  product_id: string;
  max_capacity: number;
  vehicle: { license_plate: string };
  product: { name: string };
}

interface CapacityConfig {
  id: string;
  vehicle_id: string;
  configuration_name: string;
  total_weight_capacity: number;
  total_volume_capacity: number;
  compartment_config: any[];
  is_active: boolean;
  vehicle: { license_plate: string };
}

export const VehicleCapacityConfig: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");
  const [isAddingCapacity, setIsAddingCapacity] = useState(false);
  const [configName, setConfigName] = useState("");
  const [weightCapacity, setWeightCapacity] = useState("");
  const [volumeCapacity, setVolumeCapacity] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type, status')
        .eq('status', 'active');
      if (error) throw error;
      return data as Vehicle[];
    }
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name');
      if (error) throw error;
      return data as Product[];
    }
  });

  // Fetch vehicle load capacities
  const { data: capacities, isLoading } = useQuery({
    queryKey: ['vehicle-load-capacities'],
    queryFn: async () => {
      const { data: capacityData, error: capacityError } = await supabase
        .from('vehicle_load_capacities')
        .select('id, vehicle_id, product_id, max_capacity');
      
      if (capacityError) throw capacityError;

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, license_plate');
      
      if (vehicleError) throw vehicleError;

      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name');
      
      if (productError) throw productError;

      return capacityData.map(capacity => ({
        ...capacity,
        vehicle: vehicleData.find(v => v.id === capacity.vehicle_id) || { license_plate: 'Unknown' },
        product: productData.find(p => p.id === capacity.product_id) || { name: 'Unknown' }
      })) as VehicleCapacity[];
    }
  });

  // Fetch capacity configurations
  const { data: configurations } = useQuery({
    queryKey: ['vehicle-capacity-configurations'],
    queryFn: async () => {
      const { data: configData, error: configError } = await supabase
        .from('vehicle_capacity_configurations')
        .select('id, vehicle_id, configuration_name, total_weight_capacity, total_volume_capacity, compartment_config, is_active');
      
      if (configError) throw configError;

      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, license_plate');
      
      if (vehicleError) throw vehicleError;

      return configData.map(config => ({
        ...config,
        vehicle: vehicleData.find(v => v.id === config.vehicle_id) || { license_plate: 'Unknown' }
      })) as CapacityConfig[];
    }
  });

  // Add capacity mutation
  const addCapacityMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('vehicle_load_capacities')
        .insert({
          vehicle_id: selectedVehicle,
          product_id: selectedProduct,
          max_capacity: parseInt(capacity)
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vehicle capacity added successfully");
      queryClient.invalidateQueries({ queryKey: ['vehicle-load-capacities'] });
      setSelectedVehicle("");
      setSelectedProduct("");
      setCapacity("");
      setIsAddingCapacity(false);
    },
    onError: () => {
      toast.error("Failed to add vehicle capacity");
    }
  });

  // Add configuration mutation
  const addConfigMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('vehicle_capacity_configurations')
        .insert({
          vehicle_id: selectedVehicle,
          configuration_name: configName,
          total_weight_capacity: parseFloat(weightCapacity) || null,
          total_volume_capacity: parseFloat(volumeCapacity) || null,
          compartment_config: [],
          is_active: true
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vehicle configuration added successfully");
      queryClient.invalidateQueries({ queryKey: ['vehicle-capacity-configurations'] });
      setSelectedVehicle("");
      setConfigName("");
      setWeightCapacity("");
      setVolumeCapacity("");
    }
  });

  const handleAddCapacity = () => {
    if (!selectedVehicle || !selectedProduct || !capacity) {
      toast.error("Please fill in all fields");
      return;
    }
    addCapacityMutation.mutate();
  };

  const handleAddConfiguration = () => {
    if (!selectedVehicle || !configName) {
      toast.error("Please fill in required fields");
      return;
    }
    addConfigMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Capacity Configuration</h1>
          <p className="text-muted-foreground">Manage vehicle load capacities and configurations</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAddingCapacity} onOpenChange={setIsAddingCapacity}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Capacity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Vehicle Capacity</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate} ({vehicle.vehicle_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capacity">Max Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="Enter maximum capacity"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleAddCapacity} disabled={addCapacityMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingCapacity(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="capacities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="capacities">Product Capacities</TabsTrigger>
          <TabsTrigger value="configurations">Vehicle Configurations</TabsTrigger>
        </TabsList>

        <TabsContent value="capacities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capacities?.map((capacity) => (
              <Card key={capacity.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{capacity.vehicle.license_plate}</span>
                    </div>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{capacity.product.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Max Capacity</span>
                      <Badge variant="outline">{capacity.max_capacity} units</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {(!capacities || capacities.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No vehicle capacities configured yet</p>
                <Button className="mt-4" onClick={() => setIsAddingCapacity(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Capacity
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configurations" className="space-y-4">
          <div className="mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Configuration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Vehicle Configuration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="config-vehicle">Vehicle</Label>
                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles?.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.license_plate} ({vehicle.vehicle_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="config-name">Configuration Name</Label>
                    <Input
                      id="config-name"
                      placeholder="e.g., Standard Load, Heavy Duty"
                      value={configName}
                      onChange={(e) => setConfigName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight-capacity">Weight Capacity (lbs)</Label>
                      <Input
                        id="weight-capacity"
                        type="number"
                        placeholder="Enter weight capacity"
                        value={weightCapacity}
                        onChange={(e) => setWeightCapacity(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="volume-capacity">Volume Capacity (cu ft)</Label>
                      <Input
                        id="volume-capacity"
                        type="number"
                        placeholder="Enter volume capacity"
                        value={volumeCapacity}
                        onChange={(e) => setVolumeCapacity(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={handleAddConfiguration} disabled={addConfigMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configurations?.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{config.configuration_name}</span>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{config.vehicle.license_plate}</span>
                    </div>
                    
                    {config.total_weight_capacity && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Weight Capacity</span>
                        <span>{config.total_weight_capacity} lbs</span>
                      </div>
                    )}
                    
                    {config.total_volume_capacity && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Volume Capacity</span>
                        <span>{config.total_volume_capacity} cu ft</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {(!configurations || configurations.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No vehicle configurations setup yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};