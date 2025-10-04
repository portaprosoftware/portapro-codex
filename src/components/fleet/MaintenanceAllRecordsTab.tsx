import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Eye, Edit, Check, Truck } from "lucide-react";
import { format } from "date-fns";
import { getCurrentDateInTimezone } from "@/lib/timezoneUtils";
import { MaintenanceRecordCard } from "./maintenance/MaintenanceRecordCard";
import { MaintenanceRecordModal } from "./maintenance/MaintenanceRecordModal";
import { RecurringServiceModal } from "./maintenance/RecurringServiceModal";
import { AddMaintenanceRecordDrawer } from "./AddMaintenanceRecordDrawer";
import { AddRecurringServiceSlider } from "./AddRecurringServiceSlider";
import { DeleteMaintenanceConfirmDialog } from "./maintenance/DeleteMaintenanceConfirmDialog";
import { MultiSelectVehicleFilter } from "./MultiSelectVehicleFilter";
import { MaintenancePDFExportModal } from "./MaintenancePDFExportModal";
import { toast } from "sonner";

interface MaintenanceAllRecordsTabProps {
  vehicleId?: string;
}

export const MaintenanceAllRecordsTab: React.FC<MaintenanceAllRecordsTabProps> = ({ vehicleId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicles, setSelectedVehicles] = useState<any[]>([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecordOpen, setEditRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editRecurringOpen, setEditRecurringOpen] = useState(false);
  const [editingRecurringRecord, setEditingRecurringRecord] = useState<any>(null);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [selectedRecurringRecord, setSelectedRecurringRecord] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<any>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch company timezone
  const { data: companySettings } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("company_timezone")
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ["maintenance-records", searchTerm, statusFilter, selectedVehicles.map(v => v.id), vehicleId, companySettings?.company_timezone],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicles(license_plate, vehicle_type, make, model, nickname),
          maintenance_task_types(name),
          maintenance_vendors(name)
        `)
        .order("scheduled_date", { ascending: false });

      // Filter by vehicleId if provided
      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      if (statusFilter !== "all") {
        const companyTimezone = companySettings?.company_timezone || 'America/New_York';
        const today = getCurrentDateInTimezone(companyTimezone);
        
        if (statusFilter === "scheduled") {
          // Services scheduled for today or in the future (not completed)
          query = query
            .gte("scheduled_date", today)
            .neq("status", "completed");
        } else if (statusFilter === "due_today") {
          // Services due only for today's date (not completed)
          query = query
            .eq("scheduled_date", today)
            .neq("status", "completed");
        } else if (statusFilter === "overdue") {
          // Services due yesterday or prior (not completed)
          query = query
            .lt("scheduled_date", today)
            .neq("status", "completed");
        } else if (statusFilter === "completed") {
          // Services that are marked as completed
          query = query.eq("status", "completed");
        } else {
          // For any other status filters
          query = query.eq("status", statusFilter);
        }
      }

      if (selectedVehicles.length > 0) {
        const vehicleIds = selectedVehicles.map(v => v.id);
        query = query.in("vehicle_id", vehicleIds);
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
        .select("id, license_plate, vehicle_type, make, model, nickname")
        .eq("status", "active");
      if (error) throw error;
      return data;
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from("maintenance_records")
        .delete()
        .eq("id", recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success("Maintenance record deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingRecord(null);
      // Close any open modals
      setIsModalOpen(false);
      setRecurringModalOpen(false);
      setSelectedRecord(null);
      setSelectedRecurringRecord(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete maintenance record");
    },
  });

  // Mark completed mutation
  const markCompletedMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from("maintenance_records")
        .update({ 
          status: "completed", 
          completed_date: new Date().toISOString() 
        })
        .eq("id", recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success("Maintenance record marked as completed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark maintenance record as completed");
    },
  });

  // Mark not completed mutation
  const markNotCompletedMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from("maintenance_records")
        .update({ 
          status: "scheduled", 
          completed_date: null 
        })
        .eq("id", recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-records"] });
      toast.success("Maintenance record marked as not completed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to mark maintenance record as not completed");
    },
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

  const handleMaintenanceAction = (action: 'view' | 'edit' | 'delete' | 'markCompleted' | 'markNotCompleted', record: any) => {
    if (action === 'view') {
      // Check if it's a recurring service (has next service date or mileage)
      if (record.next_service_date || record.next_service_mileage) {
        setSelectedRecurringRecord(record);
        setRecurringModalOpen(true);
      } else {
        setSelectedRecord(record);
        setIsModalOpen(true);
      }
    } else if (action === 'edit') {
      // Check if it's a recurring service (has next service date or mileage)
      if (record.next_service_date || record.next_service_mileage) {
        setEditingRecurringRecord(record);
        setEditRecurringOpen(true);
      } else {
        setEditingRecord(record);
        setEditRecordOpen(true);
      }
    } else if (action === 'delete') {
      // Handle delete action
      setDeletingRecord(record);
      setDeleteDialogOpen(true);
    } else if (action === 'markCompleted') {
      // Handle mark completed action
      markCompletedMutation.mutate(record.id);
    } else if (action === 'markNotCompleted') {
      // Handle mark not completed action
      markNotCompletedMutation.mutate(record.id);
    }
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingRecord) {
      deleteMutation.mutate(deletingRecord.id);
    }
  };

  const getSelectedVehiclesText = () => {
    if (selectedVehicles.length === 0) return "All Vehicles";
    if (selectedVehicles.length === 1) {
      const vehicle = selectedVehicles[0];
      if (vehicle.make && vehicle.model) {
        return `${vehicle.make} ${vehicle.model}${vehicle.nickname ? ` - ${vehicle.nickname}` : ''}`;
      }
      return vehicle.license_plate || "Unknown Vehicle";
    }
    return `${selectedVehicles.length} Vehicles Selected`;
  };

  const handleVehiclesChange = (vehicles: any[]) => {
    setSelectedVehicles(vehicles);
  };

  const handleClearVehicleFilter = () => {
    setSelectedVehicles([]);
  };

  const getVehicleName = (record: any) => {
    if (record.vehicles?.make && record.vehicles?.model) {
      return `${record.vehicles.make} ${record.vehicles.model}${record.vehicles.nickname ? ` - ${record.vehicles.nickname}` : ''}`;
    }
    return record.vehicles?.vehicle_type || 'Unknown Vehicle';
  };

  return (
    <div className={vehicleId ? "w-full" : "w-full max-w-6xl mx-auto"}>
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
              <SelectItem value="due_today">Due Today</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Marked Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Only show vehicle filter when NOT in vehicle context */}
          {!vehicleId && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsVehicleModalOpen(true)}
                className="flex items-center justify-center gap-2 px-3 py-2 w-auto"
              >
                <Truck className="h-4 w-4" />
                <span className="whitespace-nowrap">{getSelectedVehiclesText()}</span>
              </Button>
              {selectedVehicles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearVehicleFilter}
                  className="px-2"
                >
                  ×
                </Button>
              )}
            </div>
          )}

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
                <TableHead className="w-48 text-left font-medium">Vehicle</TableHead>
                <TableHead className="w-52 text-left font-medium">Task & Details</TableHead>
                <TableHead className="w-20 text-center font-medium">Vendor</TableHead>
                <TableHead className="w-40 text-left font-medium">Dates</TableHead>
                <TableHead className="w-24 text-left font-medium">Status</TableHead>
                <TableHead className="w-16 text-center font-medium">Cost</TableHead>
                <TableHead className="w-12 text-right font-medium">Actions</TableHead>
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
                      <MaintenanceRecordCard
                        record={record}
                        variant="table"
                        onView={(record) => handleMaintenanceAction('view', record)}
                        onEdit={(record) => handleMaintenanceAction('edit', record)}
                        onDelete={(record) => handleMaintenanceAction('delete', record)}
                        onMarkCompleted={(record) => handleMaintenanceAction('markCompleted', record)}
                        onMarkNotCompleted={(record) => handleMaintenanceAction('markNotCompleted', record)}
                      />
                   </TableRow>
                 ))
              )}
            </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>

      <MaintenanceRecordModal
        record={selectedRecord}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRecord(null);
        }}
        onEdit={(record) => handleMaintenanceAction('edit', record)}
        onDelete={(record) => handleMaintenanceAction('delete', record)}
        onMarkCompleted={(record) => handleMaintenanceAction('markCompleted', record)}
        onMarkNotCompleted={(record) => handleMaintenanceAction('markNotCompleted', record)}
      />

      {/* Recurring Service Modal */}
      <RecurringServiceModal
        record={selectedRecurringRecord}
        isOpen={recurringModalOpen}
        onClose={() => {
          setRecurringModalOpen(false);
          setSelectedRecurringRecord(null);
        }}
        onEdit={(record) => handleMaintenanceAction('edit', record)}
        onDelete={(record) => handleMaintenanceAction('delete', record)}
        onMarkCompleted={(record) => handleMaintenanceAction('markCompleted', record)}
        onMarkNotCompleted={(record) => handleMaintenanceAction('markNotCompleted', record)}
      />

      {/* Edit Maintenance Record Drawer */}
      <AddMaintenanceRecordDrawer 
        open={editRecordOpen} 
        onOpenChange={setEditRecordOpen}
        editRecord={editingRecord}
        mode="edit"
      />

      {/* Edit Recurring Service Slider */}
      <AddRecurringServiceSlider 
        open={editRecurringOpen} 
        onOpenChange={setEditRecurringOpen}
        preselectedVehicleId={editingRecurringRecord?.vehicle_id}
        editRecord={editingRecurringRecord}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMaintenanceConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingRecord(null);
        }}
        onConfirm={handleDeleteConfirm}
        recordTitle={deletingRecord?.maintenance_task_types?.name || deletingRecord?.maintenance_type || ""}
        vehicleName={deletingRecord ? getVehicleName(deletingRecord) : ""}
        isDeleting={deleteMutation.isPending}
      />

      {/* Vehicle Selection Modal */}
      <MultiSelectVehicleFilter
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedVehicles={selectedVehicles}
        onVehiclesChange={handleVehiclesChange}
      />

      {/* PDF Export Modal */}
      <MaintenancePDFExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
      />
    </div>
  );
};