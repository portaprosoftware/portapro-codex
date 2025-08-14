import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description,
  itemName,
  isLoading = false
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmValid, setIsConfirmValid] = useState(false);

  const finalDescription = description || 
    `Are you sure you want to delete "${itemName}"? This action cannot be undone and will permanently remove all associated data.`;

  // Reset confirmation text when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setIsConfirmValid(false);
    }
  }, [isOpen]);

  // Check if confirmation text matches
  useEffect(() => {
    setIsConfirmValid(confirmText.toLowerCase() === 'delete');
  }, [confirmText]);

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setIsConfirmValid(false);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="border-destructive max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive text-xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {finalDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <div className="font-medium text-destructive">Danger Zone</div>
                <div className="text-sm text-destructive/80 space-y-1">
                  <div>• All inventory data will be permanently deleted</div>
                  <div>• Location stock allocations will be removed</div>
                  <div>• Historical usage data may be affected</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              To confirm deletion, type <code className="bg-muted px-1 py-0.5 rounded text-destructive font-mono">delete</code> below:
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              className={`transition-colors ${
                confirmText && !isConfirmValid 
                  ? 'border-destructive focus-visible:ring-destructive' 
                  : isConfirmValid 
                  ? 'border-green-500 focus-visible:ring-green-500'
                  : ''
              }`}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <div className="text-sm font-medium text-center text-destructive">
            This action is irreversible. Please confirm to proceed.
          </div>
        </div>
        
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || !isConfirmValid}
            className={`flex-1 font-medium transition-all ${
              isConfirmValid
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {isConfirmValid ? 'Yes, Delete Forever' : 'Type "delete" to confirm'}
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};