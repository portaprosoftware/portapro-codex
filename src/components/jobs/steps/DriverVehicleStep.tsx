import React, { useMemo, useState, useEffect } from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Button } from '@/components/ui/button';
import { DriverSelectionModal } from '@/components/fleet/DriverSelectionModal';
import { VehicleSelectionModal } from '@/components/fleet/VehicleSelectionModal';
import { supabase } from '@/integrations/supabase/client';

export const DriverVehicleStep: React.FC = () => {
  const { state, updateData } = useJobWizard();
  const [driverOpen, setDriverOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [driverSummary, setDriverSummary] = useState<string>('');
  const [vehicleSummary, setVehicleSummary] = useState<string>('');

  const selectedDate = useMemo(() => {
    try {
      if (state.data.scheduled_date) {
        // Parse date as local date to avoid timezone offset issues
        const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date();
    } catch {
      return new Date();
    }
  }, [state.data.scheduled_date]);

  // Load driver and vehicle names when component mounts or IDs change
  useEffect(() => {
    const loadDriverName = async () => {
      if (state.data.driver_id && !driverSummary) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', state.data.driver_id)
            .single();
          
          if (data && !error) {
            setDriverSummary(`${data.first_name} ${data.last_name}`);
          }
        } catch (error) {
          console.error('Error loading driver name:', error);
        }
      }
    };

    const loadVehicleName = async () => {
      if (state.data.vehicle_id && !vehicleSummary) {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .select('license_plate, year, make, model')
            .eq('id', state.data.vehicle_id)
            .single();
          
          if (data && !error) {
            setVehicleSummary(`${data.year} ${data.make} ${data.model}\n${data.license_plate}`);
          }
        } catch (error) {
          console.error('Error loading vehicle name:', error);
        }
      }
    };

    loadDriverName();
    loadVehicleName();
  }, [state.data.driver_id, state.data.vehicle_id, driverSummary, vehicleSummary]);

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
            <div className="text-sm text-muted-foreground">
              {vehicleSummary ? (
                <div>
                  <div>{vehicleSummary.split('\n')[0]}</div>
                  <div>{vehicleSummary.split('\n')[1]}</div>
                </div>
              ) : (
                `ID: ${state.data.vehicle_id}`
              )}
            </div>
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
          if (driver) {
            updateData({ driver_id: driver.id });
            setDriverSummary(`${driver.first_name} ${driver.last_name}`);
          } else {
            updateData({ driver_id: null });
            setDriverSummary('');
          }
        }}
      />

      <VehicleSelectionModal
        open={vehicleOpen}
        onOpenChange={setVehicleOpen}
        selectedDate={selectedDate}
        selectedVehicle={undefined}
        onVehicleSelect={(vehicle) => {
          if (vehicle) {
            updateData({ vehicle_id: vehicle.id });
            setVehicleSummary(`${vehicle.year} ${vehicle.make} ${vehicle.model}\n${vehicle.license_plate}`);
          } else {
            updateData({ vehicle_id: null });
            setVehicleSummary('');
          }
        }}
      />
    </div>
  );
};
