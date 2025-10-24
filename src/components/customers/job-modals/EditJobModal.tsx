import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface EditJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
  customerId: string;
}

export function EditJobModal({ open, onOpenChange, job, customerId }: EditJobModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    status: '',
    driver_id: '',
    vehicle_id: '',
    service_location: '',
    total_price: '',
    notes: ''
  });

  // Populate form when job changes
  useEffect(() => {
    if (job) {
      setFormData({
        scheduled_date: job.scheduled_date || '',
        scheduled_time: job.scheduled_time || '',
        status: job.status || '',
        driver_id: job.driver_id || '',
        vehicle_id: job.vehicle_id || '',
        service_location: job.service_location || '',
        total_price: job.total_price?.toString() || '',
        notes: job.notes || ''
      });
    }
  }, [job]);

  // Fetch drivers
  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: async (): Promise<Array<{ id: string; first_name: string; last_name: string }>> => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'driver')
        .order('first_name');
      return data || [];
    }
  });
  const drivers = driversData || [];

  // Fetch vehicles
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-active'],
    queryFn: async (): Promise<Array<{ id: string; license_plate: string }>> => {
      const { data } = await (supabase as any)
        .from('vehicles')
        .select('id, license_plate')
        .eq('status', 'active')
        .order('license_plate');
      return data || [];
    }
  });
  const vehicles = vehiclesData || [];

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from('jobs')
        .update(updatedData)
        .eq('id', job.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Job updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['customer-jobs', customerId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData = {
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time || null,
      status: formData.status,
      driver_id: formData.driver_id || null,
      vehicle_id: formData.vehicle_id || null,
      service_location: formData.service_location || null,
      total_price: formData.total_price ? parseFloat(formData.total_price) : null,
      notes: formData.notes || null
    };

    updateMutation.mutate(updatedData);
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job: {job.job_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Scheduled Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Scheduled Time</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driver_id">Assign Driver</Label>
              <Select value={formData.driver_id} onValueChange={(value) => setFormData({ ...formData, driver_id: value })}>
                <SelectTrigger id="driver_id">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="">Unassigned</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_id">Assign Vehicle</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                <SelectTrigger id="vehicle_id">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="">No vehicle</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_location">Service Location</Label>
            <Input
              id="service_location"
              value={formData.service_location}
              onChange={(e) => setFormData({ ...formData, service_location: e.target.value })}
              placeholder="Enter service location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_price">Total Price</Label>
            <Input
              id="total_price"
              type="number"
              step="0.01"
              value={formData.total_price}
              onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this job"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
