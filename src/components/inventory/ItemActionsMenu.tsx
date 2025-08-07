import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Camera, Edit, Trash2, QrCode } from 'lucide-react';

interface ItemActionsMenuProps {
  itemId: string;
  itemCode: string;
  onEdit: () => void;
  onDelete: () => void;
  onOCRCapture: () => void;
  qrCodeData?: string | null;
}

export const ItemActionsMenu: React.FC<ItemActionsMenuProps> = ({
  itemId,
  itemCode,
  onEdit,
  onDelete,
  onOCRCapture,
  qrCodeData
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
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Item</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onOCRCapture} className="cursor-pointer">
          <Camera className="mr-2 h-4 w-4" />
          <span>OCR Tool Tracking</span>
        </DropdownMenuItem>
        
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Item</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};