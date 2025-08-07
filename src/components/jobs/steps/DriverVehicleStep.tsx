import React, { useMemo, useState } from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Button } from '@/components/ui/button';
import { DriverSelectionModal } from '@/components/fleet/DriverSelectionModal';
import { VehicleSelectionModal } from '@/components/fleet/VehicleSelectionModal';

export const DriverVehicleStep: React.FC = () => {
  const { state, updateData } = useJobWizard();
  const [driverOpen, setDriverOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [driverSummary, setDriverSummary] = useState<string>('');
  const [vehicleSummary, setVehicleSummary] = useState<string>('');

  const selectedDate = useMemo(() => {
    try {
      return state.data.scheduled_date ? new Date(state.data.scheduled_date) : new Date();
    } catch {
      return new Date();
    }
  }, [state.data.scheduled_date]);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Driver</h2>
        <div className="flex items-center gap-3">
          <Button onClick={() => setDriverOpen(true)}>Select Driver</Button>
          {state.data.driver_id ? (
            <span className="text-sm text-muted-foreground">{driverSummary || `ID: ${state.data.driver_id}`}</span>
          ) : (
            <span className="text-sm text-muted-foreground">No driver selected</span>
          )}
          {state.data.driver_id && (
            <Button variant="outline" onClick={() => { updateData({ driver_id: null }); setDriverSummary(''); }}>Clear</Button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Vehicle</h2>
        <div className="flex items-center gap-3">
          <Button onClick={() => setVehicleOpen(true)}>Select Vehicle</Button>
          {state.data.vehicle_id ? (
            <span className="text-sm text-muted-foreground">{vehicleSummary || `ID: ${state.data.vehicle_id}`}</span>
          ) : (
            <span className="text-sm text-muted-foreground">No vehicle selected</span>
          )}
          {state.data.vehicle_id && (
            <Button variant="outline" onClick={() => { updateData({ vehicle_id: null }); setVehicleSummary(''); }}>Clear</Button>
          )}
        </div>
      </section>

      <aside className="text-sm text-muted-foreground">
        Scheduled date: {state.data.scheduled_date || 'not set'}
      </aside>

      <DriverSelectionModal
        open={driverOpen}
        onOpenChange={setDriverOpen}
        selectedDate={selectedDate}
        selectedDriver={undefined}
        onDriverSelect={(driver) => {
          updateData({ driver_id: driver.id });
          setDriverSummary(`${driver.first_name} ${driver.last_name}`);
        }}
      />

      <VehicleSelectionModal
        open={vehicleOpen}
        onOpenChange={setVehicleOpen}
        selectedDate={selectedDate}
        selectedVehicle={undefined}
        onVehicleSelect={(vehicle) => {
          updateData({ vehicle_id: vehicle.id });
          setVehicleSummary(vehicle.license_plate);
        }}
      />
    </div>
  );
};
