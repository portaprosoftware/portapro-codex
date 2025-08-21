import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { RealTimeInventorySelector } from '@/components/jobs/RealTimeInventorySelector';
import { PickupInventorySelector } from '@/components/jobs/PickupInventorySelector';
import { PickupInventoryAllocationSelector } from '@/components/jobs/PickupInventoryAllocationSelector';
import { Separator } from '@/components/ui/separator';

export const ProductsServicesStep: React.FC = () => {
  const { state, updateData } = useJobWizard();

  const isPickupJob = state.data.job_type === 'pickup';
  const isDeliveryWithPickups = state.data.job_type === 'delivery' && 
    (state.data.create_pickup_job || state.data.create_partial_pickups);

  const handlePickupInventoryChange = (type: 'main_pickup' | string, items: any[]) => {
    const currentSelections = state.data.pickup_inventory_selections || {};
    
    if (type === 'main_pickup') {
      updateData({
        pickup_inventory_selections: {
          ...currentSelections,
          main_pickup: items
        }
      });
    } else {
      // Handle partial pickup
      updateData({
        pickup_inventory_selections: {
          ...currentSelections,
          partial_pickups: {
            ...(currentSelections.partial_pickups || {}),
            [type]: items
          }
        }
      });
    }
  };

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
        <>
          <RealTimeInventorySelector
            startDate={state.data.scheduled_date || new Date().toISOString().split('T')[0]}
            endDate={state.data.return_date || null}
            value={state.data.items || []}
            onChange={(items) => updateData({ items })}
          />
          
          {/* Pickup Inventory Allocation - Only show for delivery jobs with pickups */}
          {isDeliveryWithPickups && state.data.items && state.data.items.length > 0 && (
            <>
              <Separator className="my-8" />
              <PickupInventoryAllocationSelector
                deliveryItems={state.data.items}
                mainPickupItems={state.data.pickup_inventory_selections?.main_pickup || []}
                partialPickupItems={state.data.pickup_inventory_selections?.partial_pickups || {}}
                partialPickups={state.data.partial_pickups || []}
                onMainPickupChange={(items) => handlePickupInventoryChange('main_pickup', items)}
                onPartialPickupChange={(pickupId, items) => handlePickupInventoryChange(pickupId, items)}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
