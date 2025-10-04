import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EditFuelLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fuelLog: any;
}

export const EditFuelLogModal: React.FC<EditFuelLogModalProps> = ({
  open,
  onOpenChange,
  fuelLog
}) => {
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    log_date: new Date(),
    odometer_reading: '',
    gallons_purchased: '',
    cost_per_gallon: '',
    fuel_station: '',
    receipt_image: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form data when fuelLog changes
  useEffect(() => {
    if (fuelLog) {
      setFormData({
        vehicle_id: fuelLog.vehicle_id || '',
        driver_id: fuelLog.driver_id || '',
        log_date: new Date(fuelLog.log_date),
        odometer_reading: fuelLog.odometer_reading?.toString() || '',
        gallons_purchased: fuelLog.gallons_purchased?.toString() || '',
        cost_per_gallon: fuelLog.cost_per_gallon?.toString() || '',
        fuel_station: fuelLog.fuel_station || '',
        receipt_image: fuelLog.receipt_image || '',
        notes: fuelLog.notes || ''
      });
    }
  }, [fuelLog]);

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
      return data;
    }
  });

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
      return data;
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
      return data;
    }
  });

  const updateFuelLogMutation = useMutation({
    mutationFn: async (data: any) => {
      const totalCost = parseFloat(data.gallons_purchased) * parseFloat(data.cost_per_gallon);
      // Try secure Edge Function first (Clerk-verified), then fallback
      try {
        const { error: fnError } = await supabase.functions.invoke('fleet-writes', {
          body: {
            action: 'update_fuel_log',
            payload: {
              id: fuelLog.id,
              vehicle_id: data.vehicle_id,
              driver_id: data.driver_id,
              log_date: format(data.log_date, 'yyyy-MM-dd'),
              odometer_reading: parseInt(data.odometer_reading),
              gallons_purchased: parseFloat(data.gallons_purchased),
              cost_per_gallon: parseFloat(data.cost_per_gallon),
              total_cost: totalCost,
              fuel_station: data.fuel_station,
              receipt_image: data.receipt_image,
              notes: data.notes
            }
          }
        });
        if (fnError) throw fnError;
        return;
      } catch (_) {
        const { error } = await supabase
          .from('fuel_logs')
          .update({
            vehicle_id: data.vehicle_id,
            driver_id: data.driver_id,
            log_date: format(data.log_date, 'yyyy-MM-dd'),
            odometer_reading: parseInt(data.odometer_reading),
            gallons_purchased: parseFloat(data.gallons_purchased),
            cost_per_gallon: parseFloat(data.cost_per_gallon),
            total_cost: totalCost,
            fuel_station: data.fuel_station,
            receipt_image: data.receipt_image,
            notes: data.notes
          })
          .eq('id', fuelLog.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Fuel log updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['recent-fuel-logs'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update fuel log',
        variant: 'destructive'
      });
      console.error('Error updating fuel log:', error);
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

    updateFuelLogMutation.mutate(formData);
  };

  const totalCost = formData.gallons_purchased && formData.cost_per_gallon 
    ? (parseFloat(formData.gallons_purchased) * parseFloat(formData.cost_per_gallon)).toFixed(2)
    : '0.00';

  if (!fuelLog) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Fuel Log</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, vehicle_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.vehicle_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="driver">Driver *</Label>
              <Select value={formData.driver_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, driver_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateFuelLogMutation.isPending}
              className="bg-gradient-to-r from-primary to-primary-variant"
            >
              {updateFuelLogMutation.isPending ? 'Updating...' : 'Update Fuel Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};