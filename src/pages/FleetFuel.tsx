import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fuel, Plus, Upload, Edit, RefreshCw } from "lucide-react";
import { FleetSidebar } from "@/components/fleet/FleetSidebar";
import { toast } from "@/hooks/use-toast";

interface FuelLog {
  id: string;
  vehicle_id: string;
  log_date: string;
  odometer_reading: number;
  gallons_purchased: number;
  cost_per_gallon: number;
  total_cost: number;
  fuel_station: string;
  driver_id: string;
}

export default function FleetFuel() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: fuelLogs, isLoading, error, refetch } = useQuery({
    queryKey: ["fuel-logs"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("fuel_logs")
          .select(`
            *,
            vehicles!inner(license_plate, vehicle_type, make, model),
            profiles!fuel_logs_driver_id_fkey(first_name, last_name)
          `)
          .order("log_date", { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error("Error fetching fuel logs:", err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  const handleRetry = async () => {
    try {
      await refetch();
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate summary metrics
  const totalGallons = fuelLogs?.reduce((sum, log) => sum + log.gallons_purchased, 0) || 0;
  const totalCost = fuelLogs?.reduce((sum, log) => sum + log.total_cost, 0) || 0;
  const avgCostPerGallon = totalGallons > 0 ? totalCost / totalGallons : 0;

  const filteredLogs = fuelLogs?.filter(log => 
    log.vehicles?.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.fuel_station?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <FleetSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        <FleetSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading fuel logs: {error.message}</p>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <FleetSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Fuel className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Total Gallons</div>
                  <div className="text-2xl font-bold">{totalGallons.toFixed(1)}</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 text-green-600 font-bold">$</div>
                <div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                  <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 text-purple-600 font-bold">📊</div>
                <div>
                  <div className="text-sm text-gray-600">Avg Cost/Gallon</div>
                  <div className="text-2xl font-bold">${avgCostPerGallon.toFixed(2)}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fuel Logs</h1>
              <p className="text-gray-600">Track fuel consumption and costs for your fleet</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Fuel Log
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <Input
              placeholder="Search by vehicle or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Fuel Logs Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Date</th>
                    <th className="text-left p-4 font-medium text-gray-900">Vehicle</th>
                    <th className="text-left p-4 font-medium text-gray-900">Driver</th>
                    <th className="text-left p-4 font-medium text-gray-900">Odometer</th>
                    <th className="text-left p-4 font-medium text-gray-900">Gallons</th>
                    <th className="text-left p-4 font-medium text-gray-900">Cost/Gal</th>
                    <th className="text-left p-4 font-medium text-gray-900">Total Cost</th>
                    <th className="text-left p-4 font-medium text-gray-900">Station</th>
                    <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs?.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {new Date(log.log_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{log.vehicles?.license_plate}</div>
                          <div className="text-sm text-gray-600">
                            {log.vehicles?.make} {log.vehicles?.model}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {log.profiles?.first_name} {log.profiles?.last_name}
                      </td>
                      <td className="p-4">{log.odometer_reading.toLocaleString()} mi</td>
                      <td className="p-4">{log.gallons_purchased} gal</td>
                      <td className="p-4">${log.cost_per_gallon.toFixed(2)}</td>
                      <td className="p-4">${log.total_cost.toFixed(2)}</td>
                      <td className="p-4">{log.fuel_station}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredLogs?.length === 0 && (
            <div className="text-center py-12">
              <Fuel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No fuel logs found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}