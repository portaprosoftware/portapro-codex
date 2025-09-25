import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";

interface AssignmentActionsMenuProps {
  assignment: any;
  onView: (assignment: any) => void;
  onEdit: (assignment: any) => void;
  onDelete: (assignment: any) => void;
}

export const AssignmentActionsMenu: React.FC<AssignmentActionsMenuProps> = ({
  assignment,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => onView(assignment)}
          className="cursor-pointer"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onEdit(assignment)}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Assignment
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(assignment)}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Assignment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};