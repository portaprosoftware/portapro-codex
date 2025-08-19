import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UnitNavigationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemCode: string;
  showManageOption?: boolean;
  onManageUnit?: () => void; // Callback for opening manage maintenance modal
}

export const UnitNavigationDialog: React.FC<UnitNavigationDialogProps> = ({
  isOpen,
  onClose,
  itemId,
  itemCode,
  showManageOption = false,
  onManageUnit
}) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/inventory/items/${itemId}`);
    onClose();
  };

  const handleManageUnit = () => {
    if (onManageUnit) {
      onManageUnit();
    } else {
      navigate(`/inventory/manage-unit/${itemId}`);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unit {itemCode}</DialogTitle>
          <DialogDescription>
            Choose how you'd like to view or manage this unit:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleViewProfile}
            className="w-full justify-start h-auto p-4 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200"
            variant="outline"
          >
            <User className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">View Unit Profile</div>
              <div className="text-sm text-blue-700 opacity-80">
                View detailed information and history
              </div>
            </div>
          </Button>

          {showManageOption && (
            <Button
              onClick={handleManageUnit}
              className="w-full justify-start h-auto p-4 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200"
              variant="outline"
            >
              <Wrench className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Manage Maintenance</div>
                <div className="text-sm text-orange-700 opacity-80">
                  Full maintenance management interface
                </div>
              </div>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};