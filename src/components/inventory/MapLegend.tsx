import React from "react";
import { cn } from "@/lib/utils";

interface StatusCount {
  status: string;
  count: number;
  color: string;
}

interface MapLegendProps {
  statusCounts: StatusCount[];
  totalInventory: number;
  className?: string;
}

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  delivered: "Deployed",
  in_service: "Service",
  maintenance: "Maintenance",
  available: "Idle",
};

export const MapLegend: React.FC<MapLegendProps> = ({
  statusCounts,
  totalInventory,
  className,
}) => {
  return (
    <div className={cn("bg-white rounded-lg border shadow-sm p-3 md:p-4", className)}>
      {/* Title and Total */}
      <div className="mb-3">
        <h3 className="text-sm md:text-base font-semibold mb-1">Current Deployed Inventory</h3>
        <p className="text-xs text-muted-foreground">
          {totalInventory} Units • {statusCounts.length} Status Types
        </p>
      </div>

      {/* Legend Items - Wraps on Mobile */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {statusCounts.map(({ status, count, color }) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-medium">
              {statusLabels[status] || status}: <span className="font-bold">{count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
