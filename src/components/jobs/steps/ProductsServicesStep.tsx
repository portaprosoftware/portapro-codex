import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { RealTimeInventorySelector } from '@/components/jobs/RealTimeInventorySelector';
import { PickupInventorySelector } from '@/components/jobs/PickupInventorySelector';
import { PickupInventoryAllocationSelector } from '@/components/jobs/PickupInventoryAllocationSelector';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

      {/* Lock Options Section - Always visible for delivery and pickup jobs */}
      <div className="space-y-4">
        <Separator className="my-6" />
        <div className="bg-card rounded-lg border p-4 space-y-4">
          <h3 className="text-lg font-medium">Lock Options</h3>
          
          {/* Provide Locks Toggle */}
          <div className="flex items-center space-x-3">
            <Switch
              checked={state.data.locks_requested || false}
              onCheckedChange={(checked) => {
                updateData({ 
                  locks_requested: checked,
                  locks_count: checked ? (state.data.locks_count || 1) : 0
                });
              }}
            />
            <Label className="text-sm font-medium">Provide Locks for Units</Label>
          </div>

          {/* Lock Count Input - Only show when locks are requested */}
          {state.data.locks_requested && (
            <div className="space-y-2">
              <Label htmlFor="locks_count" className="text-sm font-medium">
                Number of Locks
              </Label>
              <Input
                id="locks_count"
                type="number"
                min="1"
                max="99"
                value={state.data.locks_count || 1}
                onChange={(e) => updateData({ locks_count: parseInt(e.target.value) || 1 })}
                className="w-24"
                placeholder="1"
              />
            </div>
          )}

          {/* Lock Details Textarea */}
          <div className="space-y-2">
            <Label htmlFor="lock_notes" className="text-sm font-medium">
              Lock Details (Optional)
            </Label>
            <Textarea
              id="lock_notes"
              value={state.data.lock_notes || ''}
              onChange={(e) => updateData({ lock_notes: e.target.value })}
              placeholder="Special lock instructions, key details, or other notes..."
              className="min-h-[80px]"
            />
          </div>

          {/* Zip-Tied Toggle */}
          <div className="flex items-center space-x-3">
            <Switch
              checked={state.data.zip_tied_on_dropoff || false}
              onCheckedChange={(checked) => updateData({ zip_tied_on_dropoff: checked })}
            />
            <Label className="text-sm font-medium">Units Zip-Tied Upon Drop-off</Label>
          </div>
        </div>
      </div>

      {/* Error Messages - Only show items errors, pickup inventory errors shown at bottom */}
      {state.errors.items && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm font-medium">{state.errors.items}</p>
        </div>
      )}
    </div>
  );
};
