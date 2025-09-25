import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Calendar, DollarSign, MoreVertical, Eye, Edit, Trash } from "lucide-react";
import { format } from "date-fns";

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  status: string;
  cost?: number;
  priority?: string;
  vehicles?: {
    license_plate: string;
    vehicle_type: string;
    make?: string;
    model?: string;
    nickname?: string;
  };
  maintenance_task_types?: {
    name: string;
  };
  maintenance_vendors?: {
    name: string;
  };
}

interface MaintenanceRecordCardProps {
  record: MaintenanceRecord;
  variant?: "overview" | "table" | "card";
  onView?: (record: MaintenanceRecord) => void;
  onEdit?: (record: MaintenanceRecord) => void;
  onDelete?: (record: MaintenanceRecord) => void;
}

export const MaintenanceRecordCard: React.FC<MaintenanceRecordCardProps> = ({
  record,
  variant = "card",
  onView,
  onEdit,
  onDelete
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      case "high":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "medium":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold border-0";
      case "low":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
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

  const renderActions = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onView?.(record)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(record)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDelete?.(record)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Card variant for overview sections
  if (variant === "card") {
    return (
      <Card className="bg-gray-50 border rounded-lg">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-foreground">
                {getVehicleName()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {record.vehicles?.license_plate}
              </div>
              <div className="text-sm text-foreground mt-1">
                {record.maintenance_task_types?.name || record.maintenance_type}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {record.status === "completed" && record.completed_date 
                  ? `Completed: ${format(new Date(record.completed_date), "MMM d, yyyy")}`
                  : `Scheduled: ${format(new Date(record.scheduled_date), "MMM d, yyyy")}`
                }
              </div>
              {record.cost && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <DollarSign className="h-3 w-3" />
                  <span>${record.cost.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(record.status)}>
                {record.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              {record.priority && (
                <Badge className={`${getPriorityColor(record.priority)} text-xs`}>
                  {record.priority.replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              )}
              {renderActions()}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Table row variant for all records table
  if (variant === "table") {
    return (
      <>
        <td className="font-medium py-4 text-center">
          <div>
            <div className="font-semibold text-foreground">
              {getVehicleName()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{record.vehicles?.license_plate}</div>
          </div>
        </td>
        <td className="py-4 text-center">
          <div>
            <div className="font-medium text-foreground">{record.maintenance_task_types?.name || record.maintenance_type}</div>
            <div className="text-sm text-muted-foreground truncate max-w-[180px] mt-1">{record.description}</div>
          </div>
        </td>
        <td className="text-sm py-4 text-center">{record.maintenance_vendors?.name || "In-house"}</td>
        <td className="py-4 text-center">
          <div className="text-sm">
            <div>Scheduled: {format(new Date(record.scheduled_date), "MMM d")}</div>
            {record.completed_date && (
              <div className="text-green-600 mt-1">Completed: {format(new Date(record.completed_date), "MMM d")}</div>
            )}
          </div>
        </td>
        <td className="py-4 text-center">
          <div className="flex flex-col gap-2 items-center">
            <Badge className={`${getStatusColor(record.status)} w-fit`}>
              {record.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            {record.priority && (
              <Badge className={`${getPriorityColor(record.priority)} text-xs w-fit`}>
                {record.priority.replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
          </div>
        </td>
        <td className="text-sm py-4 text-center">
          {record.cost ? `$${record.cost.toLocaleString()}` : "—"}
        </td>
        <td className="text-right py-4">
          {renderActions()}
        </td>
      </>
    );
  }

  // Default overview variant (for overdue/upcoming sections)
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-foreground">
          {getVehicleName()}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {record.vehicles?.license_plate}
        </div>
        <div className="text-sm text-foreground mt-1">
          {record.maintenance_task_types?.name || record.maintenance_type}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {record.status === "completed" && record.completed_date 
            ? `Completed: ${format(new Date(record.completed_date), "MMM d, yyyy")}`
            : `Due: ${format(new Date(record.scheduled_date), "MMM d, yyyy")}`
          }
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(record.status)}>
          {record.status.replace("_", " ")}
        </Badge>
        {renderActions()}
      </div>
    </div>
  );
};