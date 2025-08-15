import React, { useState } from "react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin } from "lucide-react";

interface LocationTransferConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (recordTransfer: boolean, notes?: string) => void;
  fromLocationName?: string;
  toLocationName?: string;
  itemCode: string;
}

export const LocationTransferConfirmDialog: React.FC<LocationTransferConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fromLocationName,
  toLocationName,
  itemCode
}) => {
  const [notes, setNotes] = useState("");
  const [recordTransfer, setRecordTransfer] = useState(true);

  const handleConfirm = () => {
    onConfirm(recordTransfer, notes);
    setNotes("");
    setRecordTransfer(true);
    onClose();
  };

  const handleCancel = () => {
    onConfirm(false);
    setNotes("");
    setRecordTransfer(true);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location Change Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="text-sm">
              <strong>Item:</strong> {itemCode}
            </div>
            <div className="text-sm">
              <strong>From:</strong> {fromLocationName || "No location"}
            </div>
            <div className="text-sm">
              <strong>To:</strong> {toLocationName || "No location"}
            </div>
            <div className="pt-2 border-t">
              Would you like to record this location change in the transfer history? 
              This will be visible in the Site Stock transfer logs.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="transfer-notes">Notes (optional)</Label>
            <Textarea
              id="transfer-notes"
              placeholder="Reason for transfer (e.g., maintenance, reorganization, etc.)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            No, don't record
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Yes, record transfer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};