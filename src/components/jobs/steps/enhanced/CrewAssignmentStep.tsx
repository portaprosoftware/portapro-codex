import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Truck, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  available: boolean;
  conflictReason?: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  year?: number;
  available: boolean;
  conflictReason?: string;
}

interface CrewAssignmentData {
  selectedDriver?: Driver;
  selectedVehicle?: Vehicle;
  hasConflicts: boolean;
}

interface CrewAssignmentStepProps {
  data: CrewAssignmentData;
  onUpdate: (data: CrewAssignmentData) => void;
  jobDates: {
    deliveryDate?: Date;
    pickupDates?: Date[];
    serviceDate?: Date;
  };
}

export const CrewAssignmentStep: React.FC<CrewAssignmentStepProps> = ({ 
  data, 
  onUpdate,
  jobDates
}) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrewData();
  }, [jobDates]);

  useEffect(() => {
    checkForConflicts();
  }, [data.selectedDriver, data.selectedVehicle]);

  const fetchCrewData = async () => {
    try {
      // Get all relevant dates for this job
      const relevantDates = [
        jobDates.deliveryDate,
        ...(jobDates.pickupDates || []),
        jobDates.serviceDate
      ].filter(Boolean);

      if (relevantDates.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch real drivers from database
      const { data: driversData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('is_active', true);

      // Fetch real vehicles from database
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type, make, model, year')
        .eq('status', 'active');

      // Check driver availability for each relevant date
      const driversWithAvailability = (driversData || []).map((driver) => ({
        id: driver.id,
        first_name: driver.first_name,
        last_name: driver.last_name,
        email: driver.email || '',
        phone: '(555) 123-4567', // placeholder since phone not in profiles table
        available: true, // simplified for now
        conflictReason: undefined
      }));

      // Check vehicle availability for each relevant date
      const vehiclesWithAvailability = (vehiclesData || []).map((vehicle) => ({
        id: vehicle.id,
        license_plate: vehicle.license_plate,
        vehicle_type: vehicle.vehicle_type,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        available: true, // simplified for now
        conflictReason: undefined
      }));

      setDrivers(driversWithAvailability);
      setVehicles(vehiclesWithAvailability);
    } catch (error) {
      console.error('Error fetching crew data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForConflicts = () => {
    const hasConflicts = 
      (data.selectedDriver && !data.selectedDriver.available) ||
      (data.selectedVehicle && !data.selectedVehicle.available);

    onUpdate({
      ...data,
      hasConflicts
    });
  };

  const selectDriver = (driver: Driver) => {
    onUpdate({
      ...data,
      selectedDriver: driver
    });
  };

  const selectVehicle = (vehicle: Vehicle) => {
    onUpdate({
      ...data,
      selectedVehicle: vehicle
    });
  };

  const getVehicleDisplayName = (vehicle: Vehicle) => {
    const parts = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean);
    const description = parts.length > 0 ? parts.join(' ') : vehicle.vehicle_type;
    return `${vehicle.license_plate} - ${description}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading crew availability...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Crew Assignment</h2>
        <p className="text-muted-foreground">Assign driver and vehicle for this job</p>
      </div>

      {/* Conflicts Warning */}
      {data.hasConflicts && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span>Scheduling Conflicts Detected</span>
            </CardTitle>
            <CardDescription>
              The selected crew has conflicts with existing schedules. Please resolve before proceeding.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Driver Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Select Driver</span>
          </CardTitle>
          <CardDescription>
            Choose an available driver for the scheduled dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className={cn(
                  "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                  data.selectedDriver?.id === driver.id
                    ? "border-primary bg-primary/5"
                    : driver.available
                    ? "border-border hover:border-primary/50"
                    : "border-destructive/30 bg-destructive/5 cursor-not-allowed"
                )}
                onClick={() => driver.available && selectDriver(driver)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {driver.first_name} {driver.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {driver.email} • {driver.phone}
                    </div>
                    {!driver.available && driver.conflictReason && (
                      <div className="text-sm text-destructive mt-1">
                        {driver.conflictReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {driver.available ? (
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
                    ) : (
                      <Badge variant="destructive">Conflict</Badge>
                    )}
                    {data.selectedDriver?.id === driver.id && (
                      <Badge>Selected</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="w-5 h-5" />
            <span>Select Vehicle</span>
          </CardTitle>
          <CardDescription>
            Choose an available vehicle for the scheduled dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={cn(
                  "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                  data.selectedVehicle?.id === vehicle.id
                    ? "border-primary bg-primary/5"
                    : vehicle.available
                    ? "border-border hover:border-primary/50"
                    : "border-destructive/30 bg-destructive/5 cursor-not-allowed"
                )}
                onClick={() => vehicle.available && selectVehicle(vehicle)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {getVehicleDisplayName(vehicle)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.vehicle_type}
                    </div>
                    {!vehicle.available && vehicle.conflictReason && (
                      <div className="text-sm text-destructive mt-1">
                        {vehicle.conflictReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {vehicle.available ? (
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
                    ) : (
                      <Badge variant="destructive">Conflict</Badge>
                    )}
                    {data.selectedVehicle?.id === vehicle.id && (
                      <Badge>Selected</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Job Schedule Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jobDates.deliveryDate && (
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>{jobDates.deliveryDate.toLocaleDateString()}</span>
              </div>
            )}
            {jobDates.pickupDates && jobDates.pickupDates.length > 0 && (
              <div className="flex justify-between">
                <span>Pickup{jobDates.pickupDates.length > 1 ? 's' : ''}:</span>
                <span>{jobDates.pickupDates.map(d => d.toLocaleDateString()).join(', ')}</span>
              </div>
            )}
            {jobDates.serviceDate && (
              <div className="flex justify-between">
                <span>Service:</span>
                <span>{jobDates.serviceDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};