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

      {/* Error Messages */}
      {state.errors.items && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm font-medium">{state.errors.items}</p>
        </div>
      )}
      
      {state.errors.pickup_inventory && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-destructive/20 rounded-full p-1 mt-0.5">
              <svg className="h-4 w-4 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-destructive font-semibold text-sm mb-1">Pickup Inventory Required</p>
              <p className="text-destructive text-sm">{state.errors.pickup_inventory}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
