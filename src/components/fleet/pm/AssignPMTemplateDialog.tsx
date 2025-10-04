import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CalendarDays, Gauge, Clock } from 'lucide-react';

interface AssignPMTemplateDialogProps {
  template: any;
}

export const AssignPMTemplateDialog: React.FC<AssignPMTemplateDialogProps> = ({ template }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [baselineMileage, setBaselineMileage] = useState('');
  const [baselineHours, setBaselineHours] = useState('');
  const [baselineDate, setBaselineDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-pm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, license_plate, vehicle_type')
        .eq('status', 'active')
        .order('license_plate');
      if (error) throw error;
      return data || [];
    }
  });

  const assignMutation = useMutation({
    mutationFn: async (scheduleData: any) => {
      const { error } = await supabase
        .from('vehicle_pm_schedules' as any)
        .insert(scheduleData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-pm-schedules'] });
      toast.success('PM schedule assigned successfully');
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to assign PM schedule');
      console.error(error);
    }
  });

  const resetForm = () => {
    setSelectedVehicleId('');
    setBaselineMileage('');
    setBaselineHours('');
    setBaselineDate(new Date().toISOString().split('T')[0]);
  };

  const handleAssign = () => {
    if (!selectedVehicleId) {
      toast.error('Please select a vehicle');
      return;
    }

    const scheduleData: any = {
      template_id: template.id,
      vehicle_id: selectedVehicleId,
      baseline_date: baselineDate,
      status: 'active',
      active: true
    };

    // Calculate next due based on trigger type
    if (template.trigger_type === 'mileage' && baselineMileage) {
      scheduleData.baseline_mileage = parseInt(baselineMileage);
      scheduleData.next_due_mileage = parseInt(baselineMileage) + (template.trigger_interval || 0);
    }

    if (template.trigger_type === 'hours' && baselineHours) {
      scheduleData.baseline_engine_hours = parseFloat(baselineHours);
      scheduleData.next_due_engine_hours = parseFloat(baselineHours) + (template.trigger_interval || 0);
    }

    if (template.trigger_type === 'days') {
      const nextDueDate = new Date(baselineDate);
      nextDueDate.setDate(nextDueDate.getDate() + (template.trigger_interval || 0));
      scheduleData.next_due_date = nextDueDate.toISOString().split('T')[0];
    }

    assignMutation.mutate(scheduleData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex-1">
          <CalendarDays className="w-4 h-4 mr-2" />
          Assign to Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign PM: {template.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Select Vehicle</Label>
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vehicle..." />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} ({vehicle.vehicle_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template.trigger_type === 'mileage' && (
            <div>
              <Label>Current Mileage</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={baselineMileage}
                  onChange={(e) => setBaselineMileage(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {template.trigger_type === 'hours' && (
            <div>
              <Label>Current Engine Hours</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 1250.5"
                  value={baselineHours}
                  onChange={(e) => setBaselineHours(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div>
            <Label>Baseline Date</Label>
            <Input
              type="date"
              value={baselineDate}
              onChange={(e) => setBaselineDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
