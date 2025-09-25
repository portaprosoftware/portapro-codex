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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
          {/* Assignment Date */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Assignment Date</span>
            </div>
            <div className="pl-6">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {format(new Date(assignment.assignment_date), "EEEE, MMMM d, yyyy")}
              </Badge>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Truck className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Vehicle Information</span>
            </div>
            {assignment.vehicles ? (
              <div className="pl-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">License Plate</span>
                  <span className="font-medium text-blue-600">{assignment.vehicles.license_plate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vehicle Type</span>
                  <span className="font-medium">{assignment.vehicles.vehicle_type?.toUpperCase() || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Make & Model</span>
                  <span className="font-medium text-blue-600">
                    {assignment.vehicles.year} {assignment.vehicles.make} {assignment.vehicles.model}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {assignment.vehicles.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="pl-6 text-sm text-red-600">
                Vehicle information not available
              </div>
            )}
          </div>

          {/* Driver Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Driver Information</span>
            </div>
            {assignment.profiles ? (
              <div className="pl-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="font-medium">
                    {assignment.profiles.first_name} {assignment.profiles.last_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge 
                    variant="outline" 
                    className={`${
                      assignment.profiles.status === "assigned" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }`}
                  >
                    {assignment.profiles.status === "assigned" ? "Assigned" : assignment.profiles.status || "Unknown"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="pl-6 text-sm text-red-600">
                Driver information not available
              </div>
            )}
          </div>

          {/* Mileage Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Mileage Information</span>
            </div>
            <div className="pl-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Start Mileage</span>
                <span className="font-medium">
                  {assignment.start_mileage ? assignment.start_mileage.toLocaleString() : "Not recorded"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">End Mileage</span>
                <span className="font-medium">
                  {assignment.end_mileage ? assignment.end_mileage.toLocaleString() : "Not recorded"}
                </span>
              </div>
              {assignment.start_mileage && assignment.end_mileage && (
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm text-gray-600 font-medium">Total Miles</span>
                  <span className="font-semibold text-blue-600">
                    {(assignment.end_mileage - assignment.start_mileage).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {assignment.notes && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Notes</span>
              </div>
              <div className="pl-6">
                <p className="text-sm text-gray-700">{assignment.notes}</p>
              </div>
            </div>
          )}

          {/* Assignment Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Assignment Details</span>
            </div>
            <div className="pl-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm text-purple-600">
                  {format(new Date(assignment.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm text-purple-600">
                  {format(new Date(assignment.updated_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Assignment ID</span>
                <span className="text-xs font-mono text-gray-500">
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