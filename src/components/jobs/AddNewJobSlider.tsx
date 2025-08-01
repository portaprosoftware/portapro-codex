
import React from 'react';
import { SimpleJobWizard } from './SimpleJobWizard';

interface AddNewJobSliderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Simplified component - now uses SimpleJobWizard
export const AddNewJobSlider: React.FC<AddNewJobSliderProps> = ({ open, onOpenChange }) => {
  if (!open) return null;
  
  return (
    <SimpleJobWizard 
      onComplete={() => {
        console.log('Job created successfully');
        onOpenChange(false);
      }}
      onCancel={() => onOpenChange(false)}
    />
  );
};
