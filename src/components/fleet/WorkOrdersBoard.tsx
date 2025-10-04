import React from "react";
import { ComprehensiveWorkOrders } from "./work-orders/ComprehensiveWorkOrders";

interface WorkOrdersBoardProps {
  vehicleId?: string;
}

export const WorkOrdersBoard: React.FC<WorkOrdersBoardProps> = ({ vehicleId }) => {
  return <ComprehensiveWorkOrders vehicleId={vehicleId} />;
};