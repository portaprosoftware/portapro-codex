import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Eye, Edit } from "lucide-react";
import { format } from "date-fns";

export const MaintenanceAllRecordsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ["maintenance-records", searchTerm, statusFilter, vehicleFilter],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type),
          maintenance_task_types(name),
          maintenance_vendors(name),
          maintenance_technicians(first_name, last_name)
        `)
        .order("scheduled_date", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (vehicleFilter !== "all") {
        query = query.eq("vehicle_id", vehicleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, license_plate, vehicle_type")
        .eq("status", "active");
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const filteredRecords = maintenanceRecords?.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.description.toLowerCase().includes(searchLower) ||
      record.vehicles?.license_plate.toLowerCase().includes(searchLower) ||
      record.maintenance_task_types?.name.toLowerCase().includes(searchLower) ||
      record.maintenance_vendors?.name.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log("Export to CSV/PDF");
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="bg-white rounded-lg border shadow-sm w-full overflow-hidden">
      <CardHeader className="px-6 py-4">
        <CardTitle className="text-xl font-semibold text-gray-900">All Maintenance Records</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles?.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {isLoading ? (
          <div className="text-center py-8">Loading maintenance records...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Vehicle</TableHead>
                <TableHead className="w-48">Task & Details</TableHead>
                <TableHead className="w-24">Vendor</TableHead>
                <TableHead className="w-28">Dates</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-20">Cost</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No maintenance records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords?.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{record.vehicles?.license_plate}</div>
                        <div className="text-xs text-gray-500">{record.vehicles?.vehicle_type}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.maintenance_task_types?.name || record.maintenance_type}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[180px]">{record.description}</div>
                        <Badge className={`${getPriorityColor(record.priority || "medium")} text-xs mt-1`}>
                          {record.priority || "medium"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{record.maintenance_vendors?.name || "In-house"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Scheduled: {format(new Date(record.scheduled_date), "MMM d")}</div>
                        {record.completed_date && (
                          <div className="text-green-600">Completed: {format(new Date(record.completed_date), "MMM d")}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.cost ? `$${record.cost.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};