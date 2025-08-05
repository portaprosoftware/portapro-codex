import React from 'react';
import { Button } from '@/components/ui/button';
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
import { Save, Trash2 } from 'lucide-react';

interface CampaignExitConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onDeleteAndExit: () => void;
  isSaving?: boolean;
}

export const CampaignExitConfirmation: React.FC<CampaignExitConfirmationProps> = ({
  isOpen,
  onClose,
  onSaveAndExit,
  onDeleteAndExit,
  isSaving = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Your Campaign Progress?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes to your campaign. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onClose}>
            Continue Editing
          </AlertDialogCancel>
          <Button
            onClick={onSaveAndExit}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <AlertDialogAction
            onClick={onDeleteAndExit}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Progress
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};