import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SimpleCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CUSTOMER_TYPES = [
  { value: 'events_festivals', label: 'Events & Festivals' },
  { value: 'construction', label: 'Construction' },
  { value: 'municipal_government', label: 'Municipal & Government' },
  { value: 'private_events_weddings', label: 'Private Events & Weddings' },
  { value: 'sports_recreation', label: 'Sports & Recreation' },
  { value: 'emergency_disaster_relief', label: 'Emergency & Disaster Relief' },
];

export function SimpleCustomerModal({ isOpen, onClose }: SimpleCustomerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    customer_type: '',
    email: '',
    phone: '',
    service_street: '',
    service_city: '',
    service_state: '',
    service_zip: '',
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('customers')
        .insert({
          name: data.name,
          customer_type: data.customer_type as "events_festivals" | "construction" | "municipal_government" | "private_events_weddings" | "sports_recreation" | "emergency_disaster_relief",
          email: data.email || null,
          phone: data.phone || null,
          service_street: data.service_street,
          service_city: data.service_city,
          service_state: data.service_state,
          service_zip: data.service_zip,
          billing_differs_from_service: false,
          deposit_required: true,
        });

      if (error) {
        console.error('Insert error:', error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer created successfully.",
      });
      setFormData({
        name: '',
        customer_type: '',
        email: '',
        phone: '',
        service_street: '',
        service_city: '',
        service_state: '',
        service_zip: '',
      });
      onClose();
    },
    onError: (error: Error) => {
      console.error("Error creating customer:", error);
      toast({
        title: "Error", 
        description: error.message || "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.customer_type || !formData.service_street || !formData.service_city || !formData.service_state || !formData.service_zip) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createCustomerMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Company name"
            />
          </div>

          <div>
            <Label htmlFor="customer_type">Customer Type *</Label>
            <Select 
              value={formData.customer_type} 
              onValueChange={(value) => handleInputChange('customer_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@company.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="service_street">Service Street *</Label>
            <Input
              id="service_street"
              value={formData.service_street}
              onChange={(e) => handleInputChange('service_street', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="service_city">City *</Label>
              <Input
                id="service_city"
                value={formData.service_city}
                onChange={(e) => handleInputChange('service_city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="service_state">State *</Label>
              <Input
                id="service_state"
                value={formData.service_state}
                onChange={(e) => handleInputChange('service_state', e.target.value)}
                placeholder="State"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="service_zip">ZIP Code *</Label>
            <Input
              id="service_zip"
              value={formData.service_zip}
              onChange={(e) => handleInputChange('service_zip', e.target.value)}
              placeholder="12345"
              maxLength={10}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createCustomerMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}