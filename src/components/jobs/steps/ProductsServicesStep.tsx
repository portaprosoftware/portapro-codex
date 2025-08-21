import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { RealTimeInventorySelector } from '@/components/jobs/RealTimeInventorySelector';
import { PickupInventorySelector } from '@/components/jobs/PickupInventorySelector';

export const ProductsServicesStep: React.FC = () => {
  const { state, updateData } = useJobWizard();

  const isPickupJob = state.data.job_type === 'pickup';

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="text-sm text-muted-foreground mb-4">
        Step 1 of 2: {isPickupJob ? 'Equipment Selection' : 'Products & Inventory'}
      </div>
      
      {isPickupJob ? (
        <PickupInventorySelector
          customerId={state.data.customer_id || ''}
          value={state.data.items || []}
          onChange={(items) => updateData({ items })}
        />
      ) : (
        <RealTimeInventorySelector
          startDate={state.data.scheduled_date || new Date().toISOString().split('T')[0]}
          endDate={state.data.return_date || null}
          value={state.data.items || []}
          onChange={(items) => updateData({ items })}
        />
      )}
    </div>
  );
};
