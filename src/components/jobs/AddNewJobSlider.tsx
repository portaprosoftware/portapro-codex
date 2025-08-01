
import React from 'react';
import { NewJobWizard } from './NewJobWizard';

interface AddNewJobSliderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddNewJobSlider: React.FC<AddNewJobSliderProps> = ({ open, onOpenChange }) => {
  return (
    <NewJobWizard 
      open={open}
      onOpenChange={onOpenChange}
    />
  );
};
