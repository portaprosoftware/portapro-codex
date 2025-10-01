import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface AddDeconModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId?: string;
  vehicleContextId?: string | null;
  vehicleContextName?: string | null;
}

export function AddDeconModal({
  open,
  onOpenChange,
  incidentId,
  vehicleContextId = null,
  vehicleContextName = null
}: AddDeconModalProps) {
  const isVehicleContextLocked = !!vehicleContextId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    vehicle_id: vehicleContextId || '',
    incident_id: incidentId || '',
    post_inspection_status: 'pass',
    notes: '',
    decon_methods: [] as string[],
    vehicle_areas: [] as string[]
  });

  const addDeconMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('decon_logs')
        .insert([{
          vehicle_id: data.vehicle_id || null,
          incident_id: data.incident_id || null,
          post_inspection_status: data.post_inspection_status,
          notes: data.notes,
          decon_methods: data.decon_methods,
          vehicle_areas: data.vehicle_areas,
          performed_at: new Date().toISOString(),
          source_context: isVehicleContextLocked ? 'vehicle_profile' : null,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decon-logs'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-decon-logs', vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-metrics', vehicleContextId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-activity', vehicleContextId] });
      
      toast({
        title: 'Success',
        description: 'Decontamination logged successfully',
      });
      
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to log decontamination',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      vehicle_id: vehicleContextId || '',
      incident_id: incidentId || '',
      post_inspection_status: 'pass',
      notes: '',
      decon_methods: [],
      vehicle_areas: []
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addDeconMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Decontamination</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isVehicleContextLocked && (
            <div>
              <Label>Vehicle</Label>
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted mt-2">
                <Truck className="w-4 h-4" />
                <span className="font-medium">{vehicleContextName || 'Selected Vehicle'}</span>
                <Badge variant="secondary" className="ml-auto">Locked</Badge>
              </div>
            </div>
          )}

          <div>
            <Label>Post-Inspection Status *</Label>
            <Select
              value={formData.post_inspection_status}
              onValueChange={(value) => setFormData({ ...formData, post_inspection_status: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">Pass - Ready for Service</SelectItem>
                <SelectItem value="fail">Fail - Requires Re-Decon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-2"
              placeholder="Decontamination procedures performed, chemicals used, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={addDeconMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
            >
              {addDeconMutation.isPending ? 'Recording...' : 'Record Decon'}
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
