import React from "react";
import { ComprehensiveWorkOrders } from "./work-orders/ComprehensiveWorkOrders";

interface WorkOrdersBoardProps {
  vehicleId?: string;
  licensePlate?: string;
  workOrders?: any[];
  onEdit?: (workOrder: any) => void;
  onViewDetails?: (workOrder: any) => void;
  onStatusChange?: (workOrderId: string, newStatus: string) => void;
  onBulkAction?: (action: string, workOrderIds: string[]) => void;
  selectedWorkOrderIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export const WorkOrdersBoard: React.FC<WorkOrdersBoardProps> = (props) => {
  return <ComprehensiveWorkOrders {...props} />;
};