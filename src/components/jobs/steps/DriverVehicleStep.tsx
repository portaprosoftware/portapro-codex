import React, { useMemo, useState, useEffect } from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DriverSelectionModal } from '@/components/fleet/DriverSelectionModal';
import { VehicleSelectionModal } from '@/components/fleet/VehicleSelectionModal';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Truck, User } from 'lucide-react';

interface AssignmentType {
  type: 'delivery' | 'pickup' | 'partial_pickup';
  id?: string;
  label: string;
  date?: string;
  time?: string;
  notes?: string;
  isPriority?: boolean;
}

export const DriverVehicleStep: React.FC = () => {
  const { state, updateData } = useJobWizard();
  const [activeAssignment, setActiveAssignment] = useState<AssignmentType | null>(null);
  const [driverOpen, setDriverOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [driverSummaries, setDriverSummaries] = useState<Record<string, string>>({});
  const [vehicleSummaries, setVehicleSummaries] = useState<Record<string, string>>({});

  const selectedDate = useMemo(() => {
    try {
      if (state.data.scheduled_date) {
        const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date();
    } catch {
      return new Date();
    }
  }, [state.data.scheduled_date]);

  // Generate assignment types based on job configuration, sorted by date
  const assignmentTypes = useMemo((): AssignmentType[] => {
    const types: AssignmentType[] = [];
    
    // Main job assignment
    types.push({
      type: 'delivery',
      label: `Main ${state.data.job_type ? state.data.job_type.charAt(0).toUpperCase() + state.data.job_type.slice(1) : 'Job'}`,
      date: state.data.scheduled_date,
      time: state.data.scheduled_time,
      isPriority: state.data.is_priority
    });

    // Partial pickup assignments (if enabled)
    if (state.data.create_partial_pickups && state.data.partial_pickups) {
      state.data.partial_pickups.forEach((pickup, index) => {
        types.push({
          type: 'partial_pickup',
          id: pickup.id,
          label: `Partial Pickup #${index + 1}`,
          date: pickup.date,
          time: pickup.time,
          notes: pickup.notes,
          isPriority: pickup.is_priority
        });
      });
    }

    // Pickup assignment (if enabled) - add after partial pickups
    if (state.data.create_pickup_job) {
      types.push({
        type: 'pickup',
        label: 'Final Pickup',
        date: state.data.pickup_date,
        time: state.data.pickup_time,
        notes: state.data.pickup_notes,
        isPriority: state.data.pickup_is_priority
      });
    }

    // Sort by date to show chronological order
    return types.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
  }, [state.data]);

  // Load driver and vehicle names
  useEffect(() => {
    const loadNames = async () => {
      const driverIds = new Set<string>();
      const vehicleIds = new Set<string>();

      // Collect all unique driver and vehicle IDs
      if (state.data.driver_id) driverIds.add(state.data.driver_id);
      if (state.data.vehicle_id) vehicleIds.add(state.data.vehicle_id);

      // Load pickup assignments
      if (state.data.pickup_driver_id) driverIds.add(state.data.pickup_driver_id);
      if (state.data.pickup_vehicle_id) vehicleIds.add(state.data.pickup_vehicle_id);

      // Load partial pickup assignments
      if (state.data.partial_pickup_assignments) {
        Object.values(state.data.partial_pickup_assignments).forEach(assignment => {
          if (assignment.driver_id) driverIds.add(assignment.driver_id);
          if (assignment.vehicle_id) vehicleIds.add(assignment.vehicle_id);
        });
      }

      // Fetch driver names
      if (driverIds.size > 0) {
        try {
          const { data: drivers, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', Array.from(driverIds));
          
          if (drivers && !error) {
            const newDriverSummaries: Record<string, string> = {};
            drivers.forEach(driver => {
              newDriverSummaries[driver.id] = `${driver.first_name} ${driver.last_name}`;
            });
            setDriverSummaries(prev => ({ ...prev, ...newDriverSummaries }));
          }
        } catch (error) {
          console.error('Error loading driver names:', error);
        }
      }

      // Fetch vehicle names
      if (vehicleIds.size > 0) {
        try {
          const { data: vehicles, error } = await supabase
            .from('vehicles')
            .select('id, license_plate, year, make, model')
            .in('id', Array.from(vehicleIds));
          
          if (vehicles && !error) {
            const newVehicleSummaries: Record<string, string> = {};
            vehicles.forEach(vehicle => {
              newVehicleSummaries[vehicle.id] = `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`;
            });
            setVehicleSummaries(prev => ({ ...prev, ...newVehicleSummaries }));
          }
        } catch (error) {
          console.error('Error loading vehicle names:', error);
        }
      }
    };

    loadNames();
  }, [state.data.driver_id, state.data.vehicle_id, state.data.pickup_driver_id, state.data.pickup_vehicle_id, state.data.partial_pickup_assignments]);

  const getAssignmentData = (assignmentType: AssignmentType) => {
    switch (assignmentType.type) {
      case 'delivery':
        return {
          driverId: state.data.driver_id,
          vehicleId: state.data.vehicle_id
        };
      case 'pickup':
        return {
          driverId: state.data.pickup_driver_id,
          vehicleId: state.data.pickup_vehicle_id
        };
      case 'partial_pickup':
        const assignment = state.data.partial_pickup_assignments?.[assignmentType.id!];
        return {
          driverId: assignment?.driver_id,
          vehicleId: assignment?.vehicle_id
        };
      default:
        return { driverId: null, vehicleId: null };
    }
  };

  const updateAssignmentData = (assignmentType: AssignmentType, driverId?: string | null, vehicleId?: string | null) => {
    switch (assignmentType.type) {
      case 'delivery':
        updateData({
          ...(driverId !== undefined && { driver_id: driverId }),
          ...(vehicleId !== undefined && { vehicle_id: vehicleId })
        });
        break;
      case 'pickup':
        updateData({
          ...(driverId !== undefined && { pickup_driver_id: driverId }),
          ...(vehicleId !== undefined && { pickup_vehicle_id: vehicleId })
        });
        break;
      case 'partial_pickup':
        const currentAssignments = state.data.partial_pickup_assignments || {};
        const assignmentData = currentAssignments[assignmentType.id!] || {};
        updateData({
          partial_pickup_assignments: {
            ...currentAssignments,
            [assignmentType.id!]: {
              ...assignmentData,
              ...(driverId !== undefined && { driver_id: driverId }),
              ...(vehicleId !== undefined && { vehicle_id: vehicleId })
            }
          }
        });
        break;
    }
  };

  const openDriverModal = (assignmentType: AssignmentType) => {
    setActiveAssignment(assignmentType);
    setDriverOpen(true);
  };

  const openVehicleModal = (assignmentType: AssignmentType) => {
    setActiveAssignment(assignmentType);
    setVehicleOpen(true);
  };

  const handleDriverSelect = (driver: any) => {
    if (activeAssignment) {
      if (driver) {
        updateAssignmentData(activeAssignment, driver.id);
        setDriverSummaries(prev => ({
          ...prev,
          [driver.id]: `${driver.first_name} ${driver.last_name}`
        }));
      } else {
        updateAssignmentData(activeAssignment, null);
      }
    }
    setDriverOpen(false);
    setActiveAssignment(null);
  };

  const handleVehicleSelect = (vehicle: any) => {
    if (activeAssignment) {
      if (vehicle) {
        updateAssignmentData(activeAssignment, undefined, vehicle.id);
        setVehicleSummaries(prev => ({
          ...prev,
          [vehicle.id]: `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
        }));
      } else {
        updateAssignmentData(activeAssignment, undefined, null);
      }
    }
    setVehicleOpen(false);
    setActiveAssignment(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Driver & Vehicle Assignments</h2>
        <p className="text-muted-foreground">
          Assign drivers and vehicles for delivery, pickup, and partial pickup jobs
        </p>
      </div>

      <div className="grid gap-6">
        {assignmentTypes.map((assignmentType, index) => {
          const assignmentData = getAssignmentData(assignmentType);
          
          return (
            <Card key={`${assignmentType.type}-${assignmentType.id || index}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    {assignmentType.label}
                  </CardTitle>
                  {assignmentType.isPriority && (
                    <Badge variant="destructive">Priority</Badge>
                  )}
                </div>
                <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                  {assignmentType.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(assignmentType.date).toLocaleDateString()}
                    </div>
                  )}
                  {assignmentType.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {assignmentType.time}
                    </div>
                  )}
                  {assignmentType.notes && (
                    <div className="text-muted-foreground">
                      {assignmentType.notes}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Driver Assignment */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Driver
                  </h4>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => openDriverModal(assignmentType)}
                    >
                      {assignmentData.driverId ? 'Change Driver' : 'Select Driver'}
                    </Button>
                    {assignmentData.driverId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {driverSummaries[assignmentData.driverId] || `ID: ${assignmentData.driverId}`}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateAssignmentData(assignmentType, null)}
                        >
                          Clear
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No driver assigned</span>
                    )}
                  </div>
                </div>

                {/* Vehicle Assignment */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Vehicle
                  </h4>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => openVehicleModal(assignmentType)}
                    >
                      {assignmentData.vehicleId ? 'Change Vehicle' : 'Select Vehicle'}
                    </Button>
                    {assignmentData.vehicleId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {vehicleSummaries[assignmentData.vehicleId] || `ID: ${assignmentData.vehicleId}`}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateAssignmentData(assignmentType, undefined, null)}
                        >
                          Clear
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No vehicle assigned</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DriverSelectionModal
        open={driverOpen}
        onOpenChange={setDriverOpen}
        selectedDate={selectedDate}
        selectedDriver={undefined}
        onDriverSelect={handleDriverSelect}
      />

      <VehicleSelectionModal
        open={vehicleOpen}
        onOpenChange={setVehicleOpen}
        selectedDate={selectedDate}
        selectedVehicle={undefined}
        onVehicleSelect={handleVehicleSelect}
      />
    </div>
  );
};
