import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Truck, User } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAnalytics } from '@/hooks/useAnalytics';
import { StockVehicleSelectionModal } from '@/components/fleet/StockVehicleSelectionModal';
import { DriverSelectionModal } from '@/components/fleet/DriverSelectionModal';
import { useFuelManagementSettings } from '@/hooks/useFuelManagementSettings';

interface AddFuelLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedVehicleId?: string;
  vehicleContextId?: string | null; // From VehicleContext - locks selector
  vehicleContextName?: string | null;
}

interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
}

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
}

interface FuelStation {
  id: string;
  name: string;
  address: string;
}

export const AddFuelLogModal: React.FC<AddFuelLogModalProps> = ({
  open,
  onOpenChange,
  preselectedVehicleId = "",
  vehicleContextId = null,
  vehicleContextName = null
}) => {
  const isVehicleContextLocked = !!vehicleContextId;
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedVehicleData, setSelectedVehicleData] = useState<any>(null);
  const [selectedDriverData, setSelectedDriverData] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();
  const { data: fuelSettings } = useFuelManagementSettings();
  
  // Initialize with vehicle context if provided
  const [formData, setFormData] = useState({
    vehicle_id: vehicleContextId || preselectedVehicleId,
    driver_id: '',
    log_date: new Date(),
    odometer_reading: '',
    gallons_purchased: '',
    cost_per_gallon: '',
    fuel_station: '',
    fuel_source: fuelSettings?.default_fuel_source || 'retail_station',
    receipt_image: '',
    notes: ''
  });

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type')
        .eq('status', 'active')
        .order('license_plate');
      
      if (error) throw error;
      return data as Vehicle[];
    }
  });

  // Fetch current mileage for selected vehicle
  const { data: vehicleMileage } = useQuery({
    queryKey: ['vehicle-mileage', formData.vehicle_id],
    queryFn: async () => {
      if (!formData.vehicle_id) return null;
      
      // Get the latest odometer reading from fuel logs
      const { data: fuelLog, error: fuelError } = await supabase
        .from('fuel_logs')
        .select('odometer_reading')
        .eq('vehicle_id', formData.vehicle_id)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fuelError) console.error('Error fetching fuel log mileage:', fuelError);
      
      // If we have fuel log data, use it
      if (fuelLog?.odometer_reading) {
        return fuelLog.odometer_reading;
      }
      
      // Otherwise, try to get from daily vehicle assignments
      const { data: assignment, error: assignmentError } = await supabase
        .from('daily_vehicle_assignments')
        .select('end_mileage, start_mileage')
        .eq('vehicle_id', formData.vehicle_id)
        .order('assignment_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (assignmentError) console.error('Error fetching assignment mileage:', assignmentError);
      
      return assignment?.end_mileage || assignment?.start_mileage || null;
    },
    enabled: !!formData.vehicle_id
  });

  // Auto-fill odometer reading when vehicle mileage is fetched
  React.useEffect(() => {
    if (vehicleMileage && !formData.odometer_reading) {
      setFormData(prev => ({
        ...prev,
        odometer_reading: vehicleMileage.toString()
      }));
    }
  }, [vehicleMileage]);

  // Fetch drivers
  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data as Driver[];
    }
  });

  // Fetch fuel stations (basic data only for selector)
  const { data: fuelStations } = useQuery({
    queryKey: ['fuel-stations', 'basic'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_stations')
        .select('id, name, address')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as FuelStation[];
    }
  });

  const addFuelLogMutation = useMutation({
    mutationFn: async (data: any) => {
      const totalCost = parseFloat(data.gallons_purchased) * parseFloat(data.cost_per_gallon);
      // Try secure Edge Function first (Clerk-verified), then gracefully fallback
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke('fleet-writes', {
          body: {
            action: 'create_fuel_log',
            payload: {
              vehicle_id: data.vehicle_id,
              driver_id: data.driver_id,
              log_date: format(data.log_date, 'yyyy-MM-dd'),
              odometer_reading: parseInt(data.odometer_reading),
              gallons_purchased: parseFloat(data.gallons_purchased),
            cost_per_gallon: parseFloat(data.cost_per_gallon),
            total_cost: totalCost,
            fuel_station: data.fuel_station,
            receipt_image: data.receipt_image,
            notes: data.notes,
            fuel_source: data.fuel_source,
          }
        }
      });
        if (fnError) throw fnError;
        return result;
      } catch (_) {
        const { error } = await supabase
          .from('fuel_logs')
          .insert({
            vehicle_id: data.vehicle_id,
            driver_id: data.driver_id,
            log_date: format(data.log_date, 'yyyy-MM-dd'),
            odometer_reading: parseInt(data.odometer_reading),
            gallons_purchased: parseFloat(data.gallons_purchased),
            cost_per_gallon: parseFloat(data.cost_per_gallon),
            total_cost: totalCost,
          fuel_station: data.fuel_station,
          receipt_image: data.receipt_image,
          notes: data.notes,
          fuel_source: data.fuel_source,
        });
      if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Fuel log added successfully'
      });
      trackEvent('vehicle_fuel_log_created', {
        vehicleId: vehicleContextId || formData.vehicle_id,
        context: vehicleContextId ? 'vehicle_profile' : 'standalone',
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['recent-fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-fuel-logs', vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-activity', vehicleContextId] });
      onOpenChange(false);
      setFormData({
        vehicle_id: vehicleContextId || preselectedVehicleId,
        driver_id: '',
        log_date: new Date(),
        odometer_reading: '',
        gallons_purchased: '',
        cost_per_gallon: '',
        fuel_station: '',
        fuel_source: fuelSettings?.default_fuel_source || 'retail_station',
        receipt_image: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add fuel log',
        variant: 'destructive'
      });
      console.error('Error adding fuel log:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.driver_id || !formData.odometer_reading || 
        !formData.gallons_purchased || !formData.cost_per_gallon) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    addFuelLogMutation.mutate(formData);
  };

  const totalCost = formData.gallons_purchased && formData.cost_per_gallon 
    ? (parseFloat(formData.gallons_purchased) * parseFloat(formData.cost_per_gallon)).toFixed(2)
    : '0.00';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[100vh] md:h-[75vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Add Fuel Log</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle">Vehicle *</Label>
              {isVehicleContextLocked ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                  <Truck className="w-4 h-4" />
                  <span className="font-medium text-sm">{vehicleContextName || 'Vehicle'}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Locked</Badge>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowVehicleModal(true)}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  {selectedVehicleData 
                    ? `${selectedVehicleData.license_plate} - ${selectedVehicleData.vehicle_type || 'Vehicle'}`
                    : 'Select vehicle'
                  }
                </Button>
              )}
            </div>

            <div>
              <Label htmlFor="driver">Driver *</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowDriverModal(true)}
              >
                <User className="mr-2 h-4 w-4" />
                {selectedDriverData 
                  ? `${selectedDriverData.first_name} ${selectedDriverData.last_name}`
                  : 'Select driver'
                }
              </Button>
            </div>
          </div>

          <div>
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.log_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.log_date ? format(formData.log_date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.log_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, log_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="odometer">Odometer Reading *</Label>
            <Input
              id="odometer"
              type="number"
              value={formData.odometer_reading}
              onChange={(e) => setFormData(prev => ({ ...prev, odometer_reading: e.target.value }))}
              placeholder="Miles"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gallons">Gallons *</Label>
              <Input
                id="gallons"
                type="number"
                step="0.01"
                value={formData.gallons_purchased}
                onChange={(e) => setFormData(prev => ({ ...prev, gallons_purchased: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="cost-per-gallon">Cost/Gallon *</Label>
              <Input
                id="cost-per-gallon"
                type="number"
                step="0.001"
                value={formData.cost_per_gallon}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_per_gallon: e.target.value }))}
                placeholder="$0.000"
              />
            </div>
          </div>

          <div>
            <Label>Total Cost: ${totalCost}</Label>
          </div>

          <div>
            <Label htmlFor="fuel_source">Fuel Source *</Label>
            <Select 
              value={formData.fuel_source} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, fuel_source: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fuel source" />
              </SelectTrigger>
              <SelectContent>
                {fuelSettings?.retail_enabled && (
                  <SelectItem value="retail_station">Retail Station</SelectItem>
                )}
                {fuelSettings?.yard_tank_enabled && (
                  <SelectItem value="yard_tank">Yard Tank</SelectItem>
                )}
                {fuelSettings?.mobile_service_enabled && (
                  <SelectItem value="mobile_service">Mobile Service</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="station">Fuel Station</Label>
            <Select value={formData.fuel_station} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, fuel_station: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select or enter station" />
              </SelectTrigger>
              <SelectContent>
                {fuelStations?.map((station) => (
                  <SelectItem key={station.id} value={station.name}>
                    {station.name} - {station.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this fuel log..."
              rows={2}
            />
          </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addFuelLogMutation.isPending}
                className="bg-gradient-to-r from-primary to-primary-variant"
              >
                {addFuelLogMutation.isPending ? 'Adding...' : 'Add Fuel Log'}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>

      <StockVehicleSelectionModal
        open={showVehicleModal}
        onOpenChange={setShowVehicleModal}
        selectedDate={formData.log_date}
        selectedVehicle={selectedVehicleData}
        onVehicleSelect={(vehicle) => {
          setSelectedVehicleData(vehicle);
          setFormData(prev => ({ 
            ...prev, 
            vehicle_id: vehicle.id,
            odometer_reading: '' // Clear to allow auto-fill
          }));
          setShowVehicleModal(false);
        }}
      />

      <DriverSelectionModal
        open={showDriverModal}
        onOpenChange={setShowDriverModal}
        selectedDate={formData.log_date}
        selectedDriver={selectedDriverData}
        onDriverSelect={(driver) => {
          setSelectedDriverData(driver);
          setFormData(prev => ({ ...prev, driver_id: driver.id }));
          setShowDriverModal(false);
        }}
      />
    </Drawer>
  );
};