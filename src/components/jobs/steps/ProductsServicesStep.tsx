import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { RealTimeInventorySelector } from '@/components/jobs/RealTimeInventorySelector';

export const ProductsServicesStep: React.FC = () => {
  const { state, updateData } = useJobWizard();

  return (
    <div className="space-y-6">
      <RealTimeInventorySelector
        startDate={state.data.scheduled_date || new Date().toISOString().split('T')[0]}
        endDate={state.data.return_date || null}
        value={state.data.items || []}
        onChange={(items) => updateData({ items })}
      />
    </div>
  );
};
