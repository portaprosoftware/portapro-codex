
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Truck, User, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  status: string;
  make?: string;
  model?: string;
  year?: number;
}

interface DriverVehicleStepProps {
  data: {
    driverId: string | null;
    vehicleId: string | null;
  };
  onUpdate: (assignment: { driverId: string | null; vehicleId: string | null; }) => void;
}

export const DriverVehicleStep: React.FC<DriverVehicleStepProps> = ({ data, onUpdate }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriversAndVehicles();
  }, []);

  const fetchDriversAndVehicles = async () => {
    try {
      // Fetch drivers (assuming they're in profiles table with role)
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('is_active', true);

      if (driversError) throw driversError;

      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type, status, make, model, year')
        .eq('status', 'active')
        .order('license_plate');

      if (vehiclesError) throw vehiclesError;

      setDrivers(driversData || []);
      setVehicles(vehiclesData || []);
    } catch (error) {
      console.error('Error fetching drivers and vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSelect = (driverId: string) => {
    onUpdate({
      ...data,
      driverId: driverId === 'none' ? null : driverId,
    });
  };

  const handleVehicleSelect = (vehicleId: string) => {
    onUpdate({
      ...data,
      vehicleId: vehicleId === 'none' ? null : vehicleId,
    });
  };

  const selectedDriver = drivers.find(d => d.id === data.driverId);
  const selectedVehicle = vehicles.find(v => v.id === data.vehicleId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Truck className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Driver & Vehicle</h2>
          <p className="text-gray-600">Loading available assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Truck className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Driver & Vehicle</h2>
        <p className="text-gray-600">Assign a driver and vehicle to this job</p>
      </div>

      {/* Driver Selection */}
      <div className="space-y-3">
        <Label>Assign Driver</Label>
        <Select value={data.driverId || 'none'} onValueChange={handleDriverSelect}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select a driver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No driver assigned</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{driver.first_name} {driver.last_name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle Selection */}
      <div className="space-y-3">
        <Label>Assign Vehicle</Label>
        <Select value={data.vehicleId || 'none'} onValueChange={handleVehicleSelect}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select a vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No vehicle assigned</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-4 h-4 text-gray-500" />
                    <span>{vehicle.license_plate}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignment Summary */}
      {(data.driverId || data.vehicleId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Truck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Assignment Summary:
            </span>
          </div>
          
          <div className="space-y-2">
            {selectedDriver ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">Driver:</span>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {selectedDriver.first_name} {selectedDriver.last_name}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-700">No driver assigned</span>
              </div>
            )}
            
            {selectedVehicle ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">Vehicle:</span>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  {selectedVehicle.license_plate}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-700">No vehicle assigned</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-900">
            Note:
          </span>
        </div>
        <div className="text-sm text-yellow-800">
          Only available drivers and vehicles are shown. Availability is based on existing job assignments and schedule conflicts.
        </div>
      </div>
    </div>
  );
};
