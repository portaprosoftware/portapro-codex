import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CalendarIcon, 
  UserIcon, 
  DollarSignIcon, 
  FileTextIcon, 
  WrenchIcon, 
  TruckIcon, 
  Edit, 
  Trash2,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'normal';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      case "high":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "normal":
      case "medium":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case "low":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "in_progress":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case "scheduled":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
      case "cancelled":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const getVehicleName = () => {
    if (record.vehicles?.make && record.vehicles?.model) {
      return `${record.vehicles.make} ${record.vehicles.model}${record.vehicles.nickname ? ` - ${record.vehicles.nickname}` : ''}`;
    }
    return record.vehicles?.vehicle_type || 'Unknown Vehicle';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <WrenchIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {record.maintenance_task_types?.name || record.maintenance_type}
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Maintenance Record - {getVehicleName()}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(record.status)}>
                {record.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {record.priority && (
                <Badge className={getPriorityColor(record.priority)}>
                  {record.priority.replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TruckIcon className="h-4 w-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">Vehicle Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Vehicle:</span>
                  <p className="font-medium">{getVehicleName()}</p>
                </div>
                <div>
                  <span className="text-gray-600">License Plate:</span>
                  <p className="font-medium">{record.vehicles?.license_plate || 'N/A'}</p>
                </div>
                {record.vehicles?.year && (
                  <div>
                    <span className="text-gray-600">Year:</span>
                    <p className="font-medium">{record.vehicles.year}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium">{record.vehicles?.vehicle_type || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <WrenchIcon className="h-4 w-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">Service Details</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Description:</span>
                  <p className="font-medium">{record.description}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Scheduled Date:</span>
                    <p className="font-medium flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(record.scheduled_date), "PPP")}
                    </p>
                  </div>
                  {record.completed_date && (
                    <div>
                      <span className="text-gray-600">Completed Date:</span>
                      <p className="font-medium flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(record.completed_date), "PPP")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Timeline */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-gray-600" />
                <h3 className="font-medium text-gray-900">Service Timeline</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="font-medium">
                    {format(new Date(record.created_at), "PPP")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium">
                    {format(new Date(record.updated_at), "PPP")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor & Cost Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Service Provider</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Provider:</span>
                    <p className="font-medium">{record.maintenance_vendors?.name || "In-house"}</p>
                  </div>
                  {record.maintenance_vendors?.contact_person && (
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <p className="font-medium">{record.maintenance_vendors.contact_person}</p>
                    </div>
                  )}
                  {record.maintenance_vendors?.phone && (
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{record.maintenance_vendors.phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSignIcon className="h-4 w-4 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Cost Information</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {record.cost && (
                    <div>
                      <span className="text-gray-600">Total Cost:</span>
                      <p className="font-medium text-lg">${record.cost.toLocaleString()}</p>
                    </div>
                  )}
                  {record.labor_cost !== undefined && record.labor_cost > 0 && (
                    <div>
                      <span className="text-gray-600">Labor Cost:</span>
                      <p className="font-medium">${record.labor_cost.toLocaleString()}</p>
                    </div>
                  )}
                  {record.parts_cost !== undefined && record.parts_cost > 0 && (
                    <div>
                      <span className="text-gray-600">Parts Cost:</span>
                      <p className="font-medium">${record.parts_cost.toLocaleString()}</p>
                    </div>
                  )}
                  {record.labor_hours && (
                    <div>
                      <span className="text-gray-600">Labor Hours:</span>
                      <p className="font-medium">{record.labor_hours} hours</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onEdit && (
              <Button
                onClick={() => {
                  onEdit(record);
                  onClose();
                }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Maintenance
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete(record);
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};