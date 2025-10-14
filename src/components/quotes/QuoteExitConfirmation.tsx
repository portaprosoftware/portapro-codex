import React, { useState } from 'react';
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

interface QuoteExitConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: (draftName: string) => void;
  onDeleteAndExit: () => void;
  isSaving?: boolean;
}

export const QuoteExitConfirmation: React.FC<QuoteExitConfirmationProps> = ({
  isOpen,
  onClose,
  onSaveAndExit,
  onDeleteAndExit,
  isSaving = false
}) => {
  const [draftName, setDraftName] = useState('');

  const handleSaveAndExit = () => {
    if (draftName.trim()) {
      onSaveAndExit(draftName.trim());
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[530px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Save Quote Progress</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes to your quote. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="draftName">Quote Draft Name</Label>
            <Input
              id="draftName"
              placeholder=""
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleSaveAndExit}
            disabled={!draftName.trim() || isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            {isSaving ? 'Saving...' : 'Save Draft - Quote'}
          </AlertDialogAction>
          <AlertDialogCancel onClick={onClose} disabled={isSaving}>
            Continue Editing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDeleteAndExit}
            disabled={isSaving}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete & Exit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};