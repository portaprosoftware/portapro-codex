
import React from 'react';
import { JobCreationWizard } from './JobCreationWizard';

interface AddNewJobSliderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Legacy component - replaced by JobCreationWizard
export const AddNewJobSlider: React.FC<AddNewJobSliderProps> = ({ open, onOpenChange }) => {
  return (
    <JobCreationWizard 
      open={open}
      onOpenChange={onOpenChange}
    />
  );
};
