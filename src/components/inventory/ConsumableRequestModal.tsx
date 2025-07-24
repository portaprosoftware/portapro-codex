import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ConsumableRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumableId?: string;
  consumableName?: string;
}

export const ConsumableRequestModal: React.FC<ConsumableRequestModalProps> = ({
  isOpen,
  onClose,
  consumableId,
  consumableName
}) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    urgency: 'normal',
    notes: '',
    requested_by_name: '',
    job_reference: ''
  });

  const queryClient = useQueryClient();

  const createRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const { error } = await supabase
        .from('qr_consumable_requests' as any)
        .insert([{
          consumable_id: consumableId,
          requested_quantity: requestData.quantity,
          urgency_level: requestData.urgency,
          notes: requestData.notes,
          requested_by_name: requestData.requested_by_name,
          job_reference: requestData.job_reference || null,
          status: 'pending'
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Consumable request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['consumable-requests'] });
      handleClose();
    },
    onError: () => {
      toast.error('Failed to submit request');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requested_by_name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    createRequestMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      quantity: 1,
      urgency: 'normal',
      notes: '',
      requested_by_name: '',
      job_reference: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Consumable</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Item</Label>
            <Input 
              value={consumableName || 'Unknown Item'} 
              disabled 
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="requested_by_name">Your Name *</Label>
            <Input
              id="requested_by_name"
              value={formData.requested_by_name}
              onChange={(e) => setFormData(prev => ({ ...prev, requested_by_name: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select 
              value={formData.urgency} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Can wait</SelectItem>
                <SelectItem value="normal">Normal - Standard delivery</SelectItem>
                <SelectItem value="high">High - Needed soon</SelectItem>
                <SelectItem value="critical">Critical - Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="job_reference">Job Reference (Optional)</Label>
            <Input
              id="job_reference"
              value={formData.job_reference}
              onChange={(e) => setFormData(prev => ({ ...prev, job_reference: e.target.value }))}
              placeholder="Job ID or reference number"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional details about your request..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};