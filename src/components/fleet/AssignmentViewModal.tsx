import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Truck, User, Calendar, Clock, FileText, MapPin } from "lucide-react";
import { format } from "date-fns";

interface AssignmentViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
}

export const AssignmentViewModal: React.FC<AssignmentViewModalProps> = ({
  open,
  onOpenChange,
  assignment
}) => {
  if (!assignment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Assignment Details
          </DialogTitle>
          <DialogDescription>
            View complete assignment information for {format(new Date(assignment.assignment_date), "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Date & Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Assignment Date</span>
              </div>
              <Badge variant="secondary">
                {format(new Date(assignment.assignment_date), "EEEE, MMMM d, yyyy")}
              </Badge>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Vehicle Information
            </h3>
            {assignment.vehicles ? (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">License Plate</span>
                  <span className="text-blue-700">{assignment.vehicles.license_plate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">Vehicle Type</span>
                  <span className="text-blue-700">{assignment.vehicles.vehicle_type?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">Make & Model</span>
                  <span className="text-blue-700">
                    {assignment.vehicles.year} {assignment.vehicles.make} {assignment.vehicles.model}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">Status</span>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {assignment.vehicles.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 rounded-lg p-4 text-center text-red-600">
                Vehicle information not available
              </div>
            )}
          </div>

          {/* Driver Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              Driver Information
            </h3>
            {assignment.profiles ? (
              <div className="bg-green-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-900">Name</span>
                  <span className="text-green-700">
                    {assignment.profiles.first_name} {assignment.profiles.last_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-900">Status</span>
                  <Badge 
                    variant="outline" 
                    className={`border-green-200 ${
                      assignment.profiles.status === "assigned" 
                        ? "text-green-700" 
                        : "text-yellow-700"
                    }`}
                  >
                    {assignment.profiles.status === "assigned" ? "Assigned" : assignment.profiles.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 rounded-lg p-4 text-center text-red-600">
                Driver information not available
              </div>
            )}
          </div>

          {/* Mileage Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Mileage Information
            </h3>
            <div className="bg-orange-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-orange-900">Start Mileage</span>
                <span className="text-orange-700">
                  {assignment.start_mileage ? assignment.start_mileage.toLocaleString() : "Not recorded"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-orange-900">End Mileage</span>
                <span className="text-orange-700">
                  {assignment.end_mileage ? assignment.end_mileage.toLocaleString() : "Not recorded"}
                </span>
              </div>
              {assignment.start_mileage && assignment.end_mileage && (
                <div className="flex items-center justify-between border-t border-orange-200 pt-2">
                  <span className="font-medium text-orange-900">Total Miles</span>
                  <span className="text-orange-700 font-semibold">
                    {(assignment.end_mileage - assignment.start_mileage).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {assignment.notes && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{assignment.notes}</p>
              </div>
            </div>
          )}

          {/* Assignment Metadata */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              Assignment Details
            </h3>
            <div className="bg-purple-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-purple-900">Created</span>
                <span className="text-purple-700">
                  {format(new Date(assignment.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-purple-900">Last Updated</span>
                <span className="text-purple-700">
                  {format(new Date(assignment.updated_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-purple-900">Assignment ID</span>
                <span className="text-purple-700 font-mono text-xs">
                  {assignment.id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};