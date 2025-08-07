import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export const DriverVehicleStep: React.FC = () => {
  const { state, updateData } = useJobWizard();

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Driver</h2>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Enter driver ID (temporary)"
            value={state.data.driver_id ?? ''}
            onChange={(e) => updateData({ driver_id: e.target.value || null })}
          />
          {state.data.driver_id && (
            <Button variant="outline" onClick={() => updateData({ driver_id: null })}>
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">We’ll replace this with a selector modal tied to availability.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Vehicle</h2>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Enter vehicle ID (temporary)"
            value={state.data.vehicle_id ?? ''}
            onChange={(e) => updateData({ vehicle_id: e.target.value || null })}
          />
          {state.data.vehicle_id && (
            <Button variant="outline" onClick={() => updateData({ vehicle_id: null })}>
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">We’ll replace this with the existing VehicleSelectionModal.</p>
      </section>

      <aside className="text-sm text-muted-foreground">
        Scheduled date: {state.data.scheduled_date || 'not set'}
      </aside>
    </div>
  );
};
