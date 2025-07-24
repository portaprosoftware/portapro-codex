
import React from 'react';
import { EnhancedJobWizard } from './EnhancedJobWizard';

interface AddNewJobSliderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Legacy component - now uses EnhancedJobWizard
export const AddNewJobSlider: React.FC<AddNewJobSliderProps> = ({ open, onOpenChange }) => {
  if (!open) return null;
  
  return (
    <EnhancedJobWizard 
      onComplete={(data) => {
        console.log('Job creation data:', data);
        onOpenChange(false);
      }}
      onCancel={() => onOpenChange(false)}
    />
  );
};
