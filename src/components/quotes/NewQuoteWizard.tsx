import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NewJobWizard } from '@/components/jobs/NewJobWizard';

interface NewQuoteWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftData?: any;
}

export const NewQuoteWizard: React.FC<NewQuoteWizardProps> = ({
  open,
  onOpenChange,
  draftData
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-hidden p-0" 
        aria-describedby="quote-wizard-description"
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">
            {draftData ? 'Resume Quote Draft' : 'Create New Quote'}
          </DialogTitle>
          <DialogDescription id="quote-wizard-description">
            {draftData 
              ? `Continue working on "${draftData.name}"`
              : 'Build a comprehensive quote for your customer'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <NewJobWizard
            open={open}
            onOpenChange={onOpenChange}
            wizardMode="quote"
            draftData={draftData}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};