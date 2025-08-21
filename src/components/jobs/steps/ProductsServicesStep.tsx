import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { RealTimeInventorySelector } from '@/components/jobs/RealTimeInventorySelector';

export const ProductsServicesStep: React.FC = () => {
  const { state, updateData, nextStep } = useJobWizard();

  return (
    <div className="space-y-6">
      <RealTimeInventorySelector
        startDate={state.data.scheduled_date || new Date().toISOString().split('T')[0]}
        endDate={state.data.return_date || null}
        value={state.data.items || []}
        onChange={(items) => updateData({ items })}
      />
      
      {/* Navigation to Services step */}
      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Continue to Services & Frequency →
        </button>
      </div>
    </div>
  );
};
