import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Edit3, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UnitNavigationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemCode: string;
  showManageOption?: boolean; // Shows "Manage Maintenance" for maintenance tab
  onEditDetails?: () => void; // Callback for opening edit modal (tracked units)
  onManageUnit?: () => void; // Callback for opening manage maintenance modal
}

export const UnitNavigationDialog: React.FC<UnitNavigationDialogProps> = ({
  isOpen,
  onClose,
  itemId,
  itemCode,
  showManageOption = false,
  onEditDetails,
  onManageUnit
}) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    navigate(`/inventory/items/${itemId}`);
    onClose();
  };

  const handleEditDetails = () => {
    if (onEditDetails) {
      onEditDetails();
    } else {
      navigate(`/inventory/manage-unit/${itemId}`);
    }
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

          {/* Show Edit Unit Details for tracked units (when showManageOption is false) */}
          {!showManageOption && (
            <Button
              onClick={handleEditDetails}
              className="w-full justify-start h-auto p-4 bg-green-50 hover:bg-green-100 text-green-900 border border-green-200"
              variant="outline"
            >
              <Edit3 className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Edit Unit Details</div>
                <div className="text-sm text-green-700 opacity-80">
                  Modify status, condition, and location
                </div>
              </div>
            </Button>
          )}

          {/* Show Manage Maintenance for maintenance tab (when showManageOption is true) */}
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