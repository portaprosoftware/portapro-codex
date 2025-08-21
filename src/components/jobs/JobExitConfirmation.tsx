import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface JobExitConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: (draftName: string) => void;
  onDeleteAndExit: () => void;
  isSaving?: boolean;
}

export const JobExitConfirmation: React.FC<JobExitConfirmationProps> = ({
  isOpen,
  onClose,
  onSaveAndExit,
  onDeleteAndExit,
  isSaving = false,
}) => {
  const [draftName, setDraftName] = useState('');

  console.log('JobExitConfirmation isOpen:', isOpen, 'isSaving:', isSaving);

  const handleSaveAndExit = () => {
    if (draftName.trim()) {
      onSaveAndExit(draftName.trim());
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Your Job Progress?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes to your job. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="draft-name" className="text-sm font-medium">
              Draft Name
            </Label>
            <Input
              id="draft-name"
              placeholder="Enter a name for this draft..."
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onClose}>
            Continue Editing
          </AlertDialogCancel>
          <Button
            onClick={handleSaveAndExit}
            disabled={isSaving || !draftName.trim()}
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