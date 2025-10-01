import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface AddIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleContextId?: string | null;
  vehicleContextName?: string | null;
}

export function AddIncidentModal({
  open,
  onOpenChange,
  vehicleContextId = null,
  vehicleContextName = null
}: AddIncidentModalProps) {
  const isVehicleContextLocked = !!vehicleContextId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vehicle_id: vehicleContextId || '',
    incident_date: new Date(),
    spill_type: '',
    severity: 'minor',
    location: '',
    description: '',
    immediate_actions: ''
  });

  const addIncidentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('spill_incidents')
        .insert([{
          vehicle_id: data.vehicle_id || null,
          incident_date: data.incident_date.toISOString(),
          spill_type: data.spill_type,
          severity: data.severity,
          location: data.location,
          description: data.description,
          immediate_actions: data.immediate_actions,
          source_context: isVehicleContextLocked ? 'vehicle_profile' : null,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-incidents', vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-metrics', vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-activity', vehicleContextId] });
      
      toast({
        title: 'Success',
        description: 'Incident logged successfully',
      });
      
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to log incident',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      vehicle_id: vehicleContextId || '',
      incident_date: new Date(),
      spill_type: '',
      severity: 'minor',
      location: '',
      description: '',
      immediate_actions: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id || !formData.spill_type) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in vehicle and spill type',
        variant: 'destructive',
      });
      return;
    }

    addIncidentMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Spill Incident</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Vehicle *</Label>
            {isVehicleContextLocked ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted mt-2">
                <Truck className="w-4 h-4" />
                <span className="font-medium">{vehicleContextName || 'Selected Vehicle'}</span>
                <Badge variant="secondary" className="ml-auto">Locked</Badge>
              </div>
            ) : (
              <Input
                className="mt-2"
                placeholder="Vehicle ID"
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              />
            )}
          </div>

          <div>
            <Label>Incident Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal mt-2',
                    !formData.incident_date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.incident_date ? format(formData.incident_date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.incident_date}
                  onSelect={(date) => setFormData({ ...formData, incident_date: date || new Date() })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Spill Type *</Label>
            <Input
              className="mt-2"
              placeholder="e.g., Sewage, Chemical, Fuel"
              value={formData.spill_type}
              onChange={(e) => setFormData({ ...formData, spill_type: e.target.value })}
            />
          </div>

          <div>
            <Label>Severity *</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="severe">Severe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Location</Label>
            <Input
              className="mt-2"
              placeholder="Where did the incident occur?"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-2"
              placeholder="Describe what happened"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Immediate Actions Taken</Label>
            <Textarea
              className="mt-2"
              placeholder="What was done immediately after the incident?"
              value={formData.immediate_actions}
              onChange={(e) => setFormData({ ...formData, immediate_actions: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={addIncidentMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0"
            >
              {addIncidentMutation.isPending ? 'Logging...' : 'Log Incident'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
