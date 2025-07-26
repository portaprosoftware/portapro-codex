import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin } from 'lucide-react';

interface AddFuelStationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddFuelStationModal: React.FC<AddFuelStationModalProps> = ({
  open,
  onOpenChange
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    default_cost_per_gallon: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addStationMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('fuel_stations')
        .insert({
          name: data.name,
          address: data.address || `${data.street}, ${data.city}, ${data.state} ${data.zip}`,
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
          phone: data.phone,
          default_cost_per_gallon: data.default_cost_per_gallon ? parseFloat(data.default_cost_per_gallon) : null,
          notes: data.notes,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Fuel station added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
      onOpenChange(false);
      setFormData({
        name: '',
        address: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        default_cost_per_gallon: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add fuel station',
        variant: 'destructive'
      });
      console.error('Error adding fuel station:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Station name is required',
        variant: 'destructive'
      });
      return;
    }

    addStationMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Add Fuel Station
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Station Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Shell Gas Station"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Full Address (Optional)</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="e.g., 123 Main St, City, State 12345"
            />
          </div>

          <div className="text-sm text-muted-foreground">Or enter address components:</div>

          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                placeholder="12345"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="default-cost">Default Cost/Gallon</Label>
            <Input
              id="default-cost"
              type="number"
              step="0.001"
              value={formData.default_cost_per_gallon}
              onChange={(e) => setFormData(prev => ({ ...prev, default_cost_per_gallon: e.target.value }))}
              placeholder="$0.000"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this station..."
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
              disabled={addStationMutation.isPending}
              className="bg-gradient-to-r from-primary to-primary-variant"
            >
              {addStationMutation.isPending ? 'Adding...' : 'Add Station'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};