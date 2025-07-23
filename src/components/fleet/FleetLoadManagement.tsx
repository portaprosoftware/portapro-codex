import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, CalendarDays, Truck, Package, AlertTriangle, CheckCircle, Edit3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VehicleLoadData {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  vehicle_type: string;
  capacities: Array<{
    product_id: string;
    product_name: string;
    max_capacity: number;
    assigned_today: number;
  }>;
  total_capacity_used: number;
  efficiency_score: number;
}

export const FleetLoadManagement: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingLoad, setEditingLoad] = useState<{ vehicleId: string; productId: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch vehicles with their load data for the selected date
  const { data: vehicleLoads, isLoading } = useQuery({
    queryKey: ["fleet-loads", selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      // Calculate daily loads for the selected date
      await supabase.rpc("calculate_daily_vehicle_loads", { target_date: dateStr });
      
      // Fetch vehicles separately first
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, license_plate, make, model, vehicle_type")
        .eq("status", "active");

      if (vehiclesError) throw vehiclesError;

      // Fetch capacities for all vehicles
      const { data: capacities } = await supabase
        .from("vehicle_load_capacities")
        .select(`
          vehicle_id,
          product_id,
          max_capacity,
          products (name)
        `);

      // Fetch daily loads for the selected date
      const { data: dailyLoads } = await supabase
        .from("daily_vehicle_loads")
        .select(`
          vehicle_id,
          product_id,
          assigned_quantity,
          products (name)
        `)
        .eq("load_date", dateStr);

      // Transform data for the UI
      const loadData: VehicleLoadData[] = vehicles?.map(vehicle => {
        const vehicleCapacities = capacities?.filter(cap => cap.vehicle_id === vehicle.id) || [];
        const vehicleDailyLoads = dailyLoads?.filter(load => load.vehicle_id === vehicle.id) || [];
        
        const capacitiesData = vehicleCapacities.map(cap => {
          const loadData = vehicleDailyLoads.find(load => load.product_id === cap.product_id);
          return {
            product_id: cap.product_id,
            product_name: "Product " + cap.product_id.slice(0, 8), // Simplified for now
            max_capacity: cap.max_capacity,
            assigned_today: loadData?.assigned_quantity || 0,
          };
        });

        const totalCapacityUsed = capacitiesData.length > 0 
          ? capacitiesData.reduce((sum, cap) => 
              sum + (cap.assigned_today / Math.max(cap.max_capacity, 1)) * 100, 0
            ) / capacitiesData.length
          : 0;

        return {
          id: vehicle.id,
          license_plate: vehicle.license_plate,
          make: vehicle.make,
          model: vehicle.model,
          vehicle_type: vehicle.vehicle_type,
          capacities: capacitiesData,
          total_capacity_used: totalCapacityUsed,
          efficiency_score: Math.min(100, totalCapacityUsed),
        };
      }) || [];

      return loadData;
    },
  });

  // Mutation to update daily load assignments
  const updateLoadMutation = useMutation({
    mutationFn: async ({ vehicleId, productId, newQuantity }: { 
      vehicleId: string; 
      productId: string; 
      newQuantity: number; 
    }) => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const { error } = await supabase
        .from("daily_vehicle_loads")
        .upsert({
          vehicle_id: vehicleId,
          product_id: productId,
          load_date: dateStr,
          assigned_quantity: newQuantity,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet-loads"] });
      setEditingLoad(null);
      setEditValue("");
    },
  });

  const handleEditSave = () => {
    if (editingLoad && editValue !== "") {
      updateLoadMutation.mutate({
        vehicleId: editingLoad.vehicleId,
        productId: editingLoad.productId,
        newQuantity: parseInt(editValue),
      });
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  const getUtilizationBadge = (percentage: number) => {
    if (percentage >= 100) return { variant: "destructive" as const, text: "Over Capacity" };
    if (percentage >= 80) return { variant: "secondary" as const, text: "High Load" };
    return { variant: "default" as const, text: "Normal" };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Package className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Load Management</h1>
            <p className="text-gray-600">Loading vehicle capacity data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Package className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Load Management</h1>
            <p className="text-gray-600">Vehicle capacity tracking and optimization</p>
          </div>
        </div>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Fleet Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleLoads?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Over Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {vehicleLoads?.filter(v => v.total_capacity_used >= 100).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {vehicleLoads?.filter(v => v.total_capacity_used >= 80 && v.total_capacity_used < 100).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicleLoads && vehicleLoads.length > 0 
                ? Math.round(vehicleLoads.reduce((sum, v) => sum + v.efficiency_score, 0) / vehicleLoads.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Load Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicleLoads?.map((vehicle) => (
          <Card key={vehicle.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{vehicle.license_plate}</CardTitle>
                    <CardDescription>
                      {vehicle.make} {vehicle.model} • {vehicle.vehicle_type}
                    </CardDescription>
                  </div>
                </div>
                <Badge {...getUtilizationBadge(vehicle.total_capacity_used)}>
                  {getUtilizationBadge(vehicle.total_capacity_used).text}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Overall Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Utilization</span>
                  <span className={getUtilizationColor(vehicle.total_capacity_used)}>
                    {Math.round(vehicle.total_capacity_used)}%
                  </span>
                </div>
                <Progress 
                  value={vehicle.total_capacity_used} 
                  className="h-2"
                />
              </div>

              {/* Individual Product Loads */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Product Loads</h4>
                {vehicle.capacities.map((capacity) => {
                  const utilizationPercent = (capacity.assigned_today / Math.max(capacity.max_capacity, 1)) * 100;
                  const isEditing = editingLoad?.vehicleId === vehicle.id && editingLoad?.productId === capacity.product_id;
                  
                  return (
                    <div key={capacity.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {capacity.product_name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-20 h-6 text-sm"
                                min="0"
                              />
                              <span className="text-xs text-gray-500">/ {capacity.max_capacity}</span>
                              <Button
                                size="sm"
                                onClick={handleEditSave}
                                className="h-6 px-2"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm text-gray-600">
                                {capacity.assigned_today} / {capacity.max_capacity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingLoad({ vehicleId: vehicle.id, productId: capacity.product_id });
                                  setEditValue(capacity.assigned_today.toString());
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className={cn("text-sm font-medium", getUtilizationColor(utilizationPercent))}>
                            {Math.round(utilizationPercent)}%
                          </div>
                          {utilizationPercent >= 100 && (
                            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicleLoads?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicle Data</h3>
            <p className="text-gray-600 mb-4">
              No vehicles with load capacity configurations found for {format(selectedDate, "MMMM d, yyyy")}.
            </p>
            <Button variant="outline">
              Configure Vehicle Capacities
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};