import React, { useState } from "react";
import { Edit3, Plus, History, CheckCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MaintenanceItemActionsProps {
  itemId: string;
  itemCode: string;
  onEditMaintenance: () => void;
  onAddUpdate: () => void;
  onViewHistory: () => void;
  onReturnToService: () => void;
}

export const MaintenanceItemActions: React.FC<MaintenanceItemActionsProps> = ({
  itemId,
  itemCode,
  onEditMaintenance,
  onAddUpdate,
  onViewHistory,
  onReturnToService,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onEditMaintenance}>
          <Edit3 className="mr-2 h-4 w-4" />
          Edit Maintenance Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddUpdate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Progress Update
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewHistory}>
          <History className="mr-2 h-4 w-4" />
          View Maintenance History
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onReturnToService}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Return to Service
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};