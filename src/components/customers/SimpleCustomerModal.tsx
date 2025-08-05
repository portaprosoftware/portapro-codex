import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createServiceLocationWithGeocoding } from '@/utils/geocoding';

interface SimpleCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CUSTOMER_TYPES = [
  { value: 'bars_restaurants', label: 'Bars & Restaurants' },
  { value: 'construction', label: 'Construction' },
  { value: 'emergency_disaster_relief', label: 'Emergency & Disaster Relief' },
  { value: 'events_festivals', label: 'Events & Festivals' },
  { value: 'municipal_government', label: 'Municipal & Government' },
  { value: 'other', label: 'Other' },
  { value: 'private_events_weddings', label: 'Private Events & Weddings' },
  { value: 'retail', label: 'Retail' },
  { value: 'sports_recreation', label: 'Sports & Recreation' },
];

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
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
    mutationFn: async (customerData: typeof formData) => {
      console.log('Creating customer with data:', customerData);
      
      const insertData = {
        name: customerData.name,
        customer_type: customerData.customer_type as any,
        email: customerData.email || null,
        phone: customerData.phone || null,
        service_street: customerData.service_street,
        service_city: customerData.service_city,
        service_state: customerData.service_state,
        service_zip: customerData.service_zip,
        billing_differs_from_service: false,
        deposit_required: true,
      };
      
      console.log('Inserting customer data:', insertData);

      const { data: insertedCustomer, error } = await supabase
        .from('customers')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Customer creation error:', error);
        throw new Error(`Database error: ${error.message}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (${error.hint})` : ''}`);
      }
      
      console.log('Customer created successfully:', insertedCustomer);
      
      // Create service location with automatic geocoding
      if (insertedCustomer && insertedCustomer[0]) {
        try {
          await createServiceLocationWithGeocoding(
            insertedCustomer[0].id,
            `${customerData.name} - Main Location`,
            customerData.service_street,
            customerData.service_city,
            customerData.service_state,
            customerData.service_zip
          );
          console.log('Service location with geocoding created successfully');
        } catch (geocodingError) {
          console.error('Failed to create service location with geocoding:', geocodingError);
          // Don't fail the entire customer creation if geocoding fails
        }
      }
      
      return insertedCustomer;
    },
    onSuccess: (insertedCustomer) => {
      console.log('Customer creation mutation succeeded');
      queryClient.invalidateQueries({ queryKey: ['customers-with-engagement'] });
      
      toast({
        title: "Success",
        description: "Customer created successfully with GPS coordinates.",
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
      console.error('Customer creation mutation failed:', error);
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
      <DialogContent className="max-w-md" aria-describedby="add-customer-description">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <div id="add-customer-description" className="sr-only">
            Fill out this form to add a new customer to your system
          </div>
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
              <Select 
                value={formData.service_state} 
                onValueChange={(value) => handleInputChange('service_state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label} ({state.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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