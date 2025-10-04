import React from "react";
import { ComprehensiveWorkOrders } from "./work-orders/ComprehensiveWorkOrders";

interface WorkOrdersBoardProps {
  vehicleId?: string;
  licensePlate?: string;
}

export const WorkOrdersBoard: React.FC<WorkOrdersBoardProps> = ({ vehicleId, licensePlate }) => {
  return <ComprehensiveWorkOrders vehicleId={vehicleId} licensePlate={licensePlate} />;
};