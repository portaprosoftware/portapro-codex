import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, UserIcon, DollarSignIcon, FileTextIcon, WrenchIcon, TruckIcon, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  cost?: number;
  labor_hours?: number;
  parts_cost?: number;
  labor_cost?: number;
  created_at: string;
  updated_at: string;
  vehicles?: {
    license_plate: string;
    vehicle_type: string;
    make?: string;
    model?: string;
    nickname?: string;
    year?: number;
  };
  maintenance_task_types?: {
    name: string;
  };
  maintenance_vendors?: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  };
}

interface MaintenanceRecordModalProps {
  record: MaintenanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (record: MaintenanceRecord) => void;
  onDelete?: (record: MaintenanceRecord) => void;
}

export const MaintenanceRecordModal: React.FC<MaintenanceRecordModalProps> = ({
  record,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!record) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white border-red-600";
      case "high":
        return "bg-orange-500 text-white border-orange-600";
      case "medium":
        return "bg-yellow-500 text-white border-yellow-600";
      case "low":
        return "bg-green-500 text-white border-green-600";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  };

  const getVehicleName = () => {
    const vehicle = record.vehicles;
    if (!vehicle) return `Vehicle ID: ${record.vehicle_id}`;
    
    if (vehicle.make && vehicle.model) {
      const name = vehicle.nickname 
        ? `${vehicle.make} ${vehicle.model} (${vehicle.nickname})`
        : `${vehicle.make} ${vehicle.model}`;
      return vehicle.year ? `${vehicle.year} ${name}` : name;
    }
    return vehicle.license_plate || `Vehicle ID: ${record.vehicle_id}`;
  };

  const handleEdit = () => {
    if (onEdit && record) {
      onEdit(record);
    }
  };

  const handleDelete = () => {
    if (onDelete && record) {
      onDelete(record);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Maintenance Record Details
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Record ID: {record.id}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TruckIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-foreground">Vehicle Information</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span className="font-medium text-foreground">{getVehicleName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Plate:</span>
                  <span className="font-medium text-foreground">{record.vehicles?.license_plate || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium text-foreground">{record.vehicles?.vehicle_type || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <WrenchIcon className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-foreground">Maintenance Details</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Task Type:</span>
                  <span className="font-medium text-foreground">
                    {record.maintenance_task_types?.name || record.maintenance_type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`${getStatusColor(record.status)} w-fit`}>
                    {record.status.replace("_", " ")}
                  </Badge>
                </div>
                {record.priority && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge className={`${getPriorityColor(record.priority)} w-fit`}>
                      {record.priority}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-foreground">Schedule Information</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled:</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(record.scheduled_date), "MMM d, yyyy")}
                  </span>
                </div>
                {record.completed_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium text-green-600">
                      {format(new Date(record.completed_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(record.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSignIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-foreground">Cost Information</h3>
              </div>
              <div className="space-y-2">
                {record.cost ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-bold text-foreground">${record.cost.toLocaleString()}</span>
                    </div>
                    {record.labor_cost && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Labor Cost:</span>
                        <span className="font-medium text-foreground">${record.labor_cost.toLocaleString()}</span>
                      </div>
                    )}
                    {record.parts_cost && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Parts Cost:</span>
                        <span className="font-medium text-foreground">${record.parts_cost.toLocaleString()}</span>
                      </div>
                    )}
                    {record.labor_hours && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Labor Hours:</span>
                        <span className="font-medium text-foreground">{record.labor_hours}h</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <span className="text-muted-foreground">No cost information available</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Information */}
          {record.maintenance_vendors && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-foreground">Vendor Information</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company:</span>
                    <span className="font-medium text-foreground">{record.maintenance_vendors.name}</span>
                  </div>
                  {record.maintenance_vendors.contact_person && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium text-foreground">{record.maintenance_vendors.contact_person}</span>
                    </div>
                  )}
                  {record.maintenance_vendors.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium text-foreground">{record.maintenance_vendors.phone}</span>
                    </div>
                  )}
                  {record.maintenance_vendors.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium text-foreground">{record.maintenance_vendors.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileTextIcon className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-foreground">Description</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-foreground whitespace-pre-wrap">
                  {record.description || "No description provided."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};