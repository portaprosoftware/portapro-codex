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
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle>Save Your Job Progress?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes to your job. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="draft-name" className="text-sm font-medium">
              Draft Name
            </Label>
            <Input
              id="draft-name"
              placeholder="Draft name..."
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>

        <AlertDialogFooter className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <AlertDialogCancel onClick={onClose}>
              Continue Editing
            </AlertDialogCancel>
            <Button
              onClick={handleSaveAndExit}
              disabled={isSaving || !draftName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <AlertDialogAction
              onClick={onDeleteAndExit}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};