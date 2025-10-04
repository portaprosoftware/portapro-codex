import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CalendarDays, Gauge, Clock, Truck } from 'lucide-react';
import { StockVehicleSelectionModal } from '../StockVehicleSelectionModal';

interface AssignPMTemplateDialogProps {
  template: any;
  onOpenChange?: (open: boolean) => void;
  vehicleId?: string;
}

export const AssignPMTemplateDialog: React.FC<AssignPMTemplateDialogProps> = ({ 
  template, 
  onOpenChange,
  vehicleId
}) => {
  const [isOpen, setIsOpen] = useState(onOpenChange ? true : false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [baselineMileage, setBaselineMileage] = useState('');
  const [baselineHours, setBaselineHours] = useState('');
  const [baselineDate, setBaselineDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  // Load the vehicle if vehicleId is provided
  const { data: initialVehicle } = useQuery({
    queryKey: ['vehicle-for-pm', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId
  });

  // Set the initial vehicle when loaded
  useEffect(() => {
    if (initialVehicle && !selectedVehicle) {
      setSelectedVehicle(initialVehicle);
    }
  }, [initialVehicle, selectedVehicle]);

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
      const shouldClose = !onOpenChange;
      if (shouldClose) {
        setIsOpen(false);
      } else {
        onOpenChange?.(false);
      }
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to assign PM schedule');
      console.error(error);
    }
  });

  const resetForm = () => {
    if (!vehicleId) {
      setSelectedVehicle(null);
    }
    setBaselineMileage('');
    setBaselineHours('');
    setBaselineDate(new Date().toISOString().split('T')[0]);
  };

  const handleAssign = () => {
    if (!selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }

    const scheduleData: any = {
      template_id: template.id,
      vehicle_id: selectedVehicle.id,
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <Dialog open={onOpenChange ? true : isOpen} onOpenChange={handleOpenChange}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="flex-1">
            <CalendarDays className="w-4 h-4 mr-2" />
            Assign to Vehicle
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign PM: {template?.name || 'Schedule'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Select Vehicle</Label>
            {selectedVehicle ? (
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold">{selectedVehicle.license_plate}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedVehicle(null)}
                  >
                    Change
                  </Button>
                </div>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsVehicleModalOpen(true)}
              >
                <Truck className="w-4 h-4 mr-2" />
                Choose a vehicle...
              </Button>
            )}
          </div>

          {template?.trigger_type === 'mileage' && (
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

          {template?.trigger_type === 'hours' && (
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
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign Schedule'}
            </Button>
          </div>
        </div>
      </DialogContent>

      <StockVehicleSelectionModal
        open={isVehicleModalOpen}
        onOpenChange={setIsVehicleModalOpen}
        selectedDate={new Date()}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={(vehicle) => {
          setSelectedVehicle(vehicle);
          setIsVehicleModalOpen(false);
        }}
      />
    </Dialog>
  );
};
