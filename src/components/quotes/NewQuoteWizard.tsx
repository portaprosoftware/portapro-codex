import React from 'react';
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
    <NewJobWizard
      open={open}
      onOpenChange={onOpenChange}
      wizardMode="quote"
      draftData={draftData}
    />
  );
};