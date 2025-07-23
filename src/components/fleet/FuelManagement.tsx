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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Fuel, 
  Plus, 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  MapPin,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface FuelLog {
  id: string;
  vehicle_id: string;
  driver_id: string;
  log_date: string;
  odometer_reading: number;
  gallons_purchased: number;
  cost_per_gallon: number;
  total_cost: number;
  fuel_station?: string;
  receipt_image?: string;
  notes?: string;
  created_at: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
}

export const FuelManagement = () => {
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, vehicle_type")
        .eq("status", "active")
        .order("license_plate");
      
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: fuelLogs, isLoading } = useQuery({
    queryKey: ["fuel-logs", selectedVehicle],
    queryFn: async () => {
      let query = supabase
        .from("fuel_logs")
        .select("*")
        .order("log_date", { ascending: false });
        
      if (selectedVehicle) {
        query = query.eq("vehicle_id", selectedVehicle);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FuelLog[];
    },
  });

  const { data: fuelStats } = useQuery({
    queryKey: ["fuel-stats", selectedVehicle],
    queryFn: async () => {
      let query = supabase
        .from("fuel_logs")
        .select("gallons_purchased, total_cost, odometer_reading");
        
      if (selectedVehicle) {
        query = query.eq("vehicle_id", selectedVehicle);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return {
          totalGallons: 0,
          totalCost: 0,
          avgCostPerGallon: 0,
          avgMPG: 0
        };
      }
      
      const totalGallons = data.reduce((sum, log) => sum + log.gallons_purchased, 0);
      const totalCost = data.reduce((sum, log) => sum + log.total_cost, 0);
      const avgCostPerGallon = totalCost / totalGallons;
      
      return {
        totalGallons,
        totalCost,
        avgCostPerGallon,
        avgMPG: 0 // Calculate based on odometer differences
      };
    },
  });

  const addFuelLogMutation = useMutation({
    mutationFn: async (logData: {
      vehicle_id: string;
      driver_id: string;
      log_date: string;
      odometer_reading: number;
      gallons_purchased: number;
      cost_per_gallon: number;
      total_cost: number;
      fuel_station?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("fuel_logs")
        .insert([logData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      queryClient.invalidateQueries({ queryKey: ["fuel-stats"] });
      setShowAddLogModal(false);
      toast.success("Fuel log added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add fuel log");
    }
  });

  const FuelLogForm = ({ onSubmit, onCancel }: {
    onSubmit: (data: {
      vehicle_id: string;
      driver_id: string;
      log_date: string;
      odometer_reading: number;
      gallons_purchased: number;
      cost_per_gallon: number;
      total_cost: number;
      fuel_station?: string;
      notes?: string;
    }) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      vehicle_id: "",
      driver_id: "00000000-0000-0000-0000-000000000000", // Temporary default
      log_date: format(new Date(), "yyyy-MM-dd"),
      odometer_reading: 0,
      gallons_purchased: 0,
      cost_per_gallon: 0,
      total_cost: 0,
      fuel_station: "",
      notes: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const calculatedTotal = formData.gallons_purchased * formData.cost_per_gallon;
      onSubmit({
        ...formData,
        total_cost: calculatedTotal
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="vehicle_id">Vehicle *</Label>
          <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="log_date">Date *</Label>
            <Input
              id="log_date"
              type="date"
              value={formData.log_date}
              onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="odometer_reading">Odometer Reading *</Label>
            <Input
              id="odometer_reading"
              type="number"
              value={formData.odometer_reading}
              onChange={(e) => setFormData({ ...formData, odometer_reading: parseInt(e.target.value) })}
              placeholder="Miles"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gallons_purchased">Gallons Purchased *</Label>
            <Input
              id="gallons_purchased"
              type="number"
              step="0.01"
              value={formData.gallons_purchased}
              onChange={(e) => setFormData({ ...formData, gallons_purchased: parseFloat(e.target.value) })}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label htmlFor="cost_per_gallon">Cost per Gallon *</Label>
            <Input
              id="cost_per_gallon"
              type="number"
              step="0.01"
              value={formData.cost_per_gallon}
              onChange={(e) => setFormData({ ...formData, cost_per_gallon: parseFloat(e.target.value) })}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="fuel_station">Fuel Station</Label>
          <Input
            id="fuel_station"
            value={formData.fuel_station}
            onChange={(e) => setFormData({ ...formData, fuel_station: e.target.value })}
            placeholder="Shell, Chevron, etc."
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm font-medium">
            Total Cost: ${(formData.gallons_purchased * formData.cost_per_gallon).toFixed(2)}
          </p>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={addFuelLogMutation.isPending}>
            Add Fuel Log
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fuel Management</h1>
          <p className="text-muted-foreground">Track fuel consumption and costs</p>
        </div>
        <Dialog open={showAddLogModal} onOpenChange={setShowAddLogModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Fuel Log
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Fuel Log Entry</DialogTitle>
            </DialogHeader>
            <FuelLogForm
              onSubmit={(data) => addFuelLogMutation.mutate(data)}
              onCancel={() => setShowAddLogModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Vehicle Filter */}
      <div className="flex items-center space-x-4">
        <Label htmlFor="vehicle-filter">Filter by Vehicle:</Label>
        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="All vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All vehicles</SelectItem>
            {vehicles?.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.license_plate} ({vehicle.vehicle_type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gallons</p>
                <p className="text-2xl font-bold">{fuelStats?.totalGallons.toFixed(1) || '0.0'}</p>
              </div>
              <Fuel className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${fuelStats?.totalCost.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Cost/Gallon</p>
                <p className="text-2xl font-bold">${fuelStats?.avgCostPerGallon.toFixed(2) || '0.00'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fuel Logs</p>
                <p className="text-2xl font-bold">{fuelLogs?.length || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Fuel Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : fuelLogs && fuelLogs.length > 0 ? (
            <div className="space-y-4">
              {fuelLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Vehicle: {log.vehicle_id.substring(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.log_date), "MMM dd, yyyy")}
                        {log.fuel_station && ` • ${log.fuel_station}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Gallons</p>
                      <p className="font-medium">{log.gallons_purchased.toFixed(1)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Cost/Gal</p>
                      <p className="font-medium">${log.cost_per_gallon.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium text-green-600">${log.total_cost.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Odometer</p>
                      <p className="font-medium">{log.odometer_reading.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Fuel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No fuel logs found</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking fuel consumption by adding your first fuel log.
              </p>
              <Button onClick={() => setShowAddLogModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Fuel Log
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};