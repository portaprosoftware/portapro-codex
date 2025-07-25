import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const customerSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  customer_type: z.enum(['events_festivals', 'sports_recreation', 'municipal_government', 'commercial', 'construction', 'emergency_disaster_relief', 'private_events_weddings', 'not_selected']).optional(),
  service_street: z.string().min(1, 'Street address is required'),
  service_street_2: z.string().optional(),
  service_city: z.string().min(1, 'City is required'),
  service_state: z.string().min(1, 'State is required'),
  service_zip: z.string().min(1, 'ZIP code is required'),
  billing_address: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_zip: z.string().optional(),
  notes: z.string().optional(),
  billing_differs_from_service: z.boolean().optional(),
  deposit_required: z.boolean().optional(),
}).refine((data) => {
  if (data.billing_differs_from_service) {
    return data.billing_address && data.billing_city && data.billing_state && data.billing_zip;
  }
  return true;
}, {
  message: "Billing address fields are required when billing differs from service address",
  path: ["billing_address"],
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  customer_type?: string;
  address?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  billing_differs_from_service?: boolean;
  deposit_required?: boolean;
}

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CUSTOMER_TYPES = [
  { value: 'events_festivals', label: 'Events & Festivals' },
  { value: 'sports_recreation', label: 'Sports & Recreation' },
  { value: 'municipal_government', label: 'Municipal & Government' },
  { value: 'private_events_weddings', label: 'Private Events & Weddings' },
  { value: 'construction', label: 'Construction' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'emergency_disaster_relief', label: 'Emergency & Disaster Relief' },
];

export function EditCustomerModal({ isOpen, onClose, customer }: EditCustomerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Parse existing address into components
  const parseAddress = (address?: string) => {
    if (!address) return { street: '', street2: '', city: '', state: '', zip: '' };
    const parts = address.split(',').map(part => part.trim());
    return {
      street: parts[0] || '',
      street2: '',
      city: parts[1] || '',
      state: parts[2] || '',
      zip: parts[3] || ''
    };
  };

  const serviceAddress = parseAddress(customer?.address);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      customer_type: customer?.customer_type as any || '',
      service_street: serviceAddress.street,
      service_street_2: serviceAddress.street2,
      service_city: serviceAddress.city,
      service_state: serviceAddress.state,
      service_zip: serviceAddress.zip,
      billing_address: customer?.billing_address || '',
      billing_city: customer?.billing_city || '',
      billing_state: customer?.billing_state || '',
      billing_zip: customer?.billing_zip || '',
      notes: customer?.notes || '',
      billing_differs_from_service: customer?.billing_differs_from_service || false,
      deposit_required: customer?.deposit_required ?? true,
    },
  });

  const billingDiffers = form.watch('billing_differs_from_service');
  const depositRequired = form.watch('deposit_required');

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // Combine service address fields
      const serviceAddressString = `${data.service_street}${data.service_street_2 ? `, ${data.service_street_2}` : ''}, ${data.service_city}, ${data.service_state}, ${data.service_zip}`;
      
      // If billing doesn't differ, copy service address to billing
      if (!data.billing_differs_from_service) {
        data.billing_address = data.service_street + (data.service_street_2 ? `, ${data.service_street_2}` : '');
        data.billing_city = data.service_city;
        data.billing_state = data.service_state;
        data.billing_zip = data.service_zip;
      }
      
      const { error } = await supabase
        .from('customers')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          customer_type: data.customer_type,
          address: serviceAddressString,
          billing_address: data.billing_address,
          billing_city: data.billing_city,
          billing_state: data.billing_state,
          billing_zip: data.billing_zip,
          notes: data.notes,
          billing_differs_from_service: data.billing_differs_from_service,
          deposit_required: data.deposit_required,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: 'Success',
        description: 'Customer created successfully.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create customer.',
        variant: 'destructive',
      });
      console.error('Error creating customer:', error);
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!customer?.id) throw new Error('Customer ID is required for updates');
      
      // Combine service address fields
      const serviceAddressString = `${data.service_street}${data.service_street_2 ? `, ${data.service_street_2}` : ''}, ${data.service_city}, ${data.service_state}, ${data.service_zip}`;
      
      // If billing doesn't differ, copy service address to billing
      if (!data.billing_differs_from_service) {
        data.billing_address = data.service_street + (data.service_street_2 ? `, ${data.service_street_2}` : '');
        data.billing_city = data.service_city;
        data.billing_state = data.service_state;
        data.billing_zip = data.service_zip;
      }
      
      const { error } = await supabase
        .from('customers')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          customer_type: data.customer_type,
          address: serviceAddressString,
          billing_address: data.billing_address,
          billing_city: data.billing_city,
          billing_state: data.billing_state,
          billing_zip: data.billing_zip,
          notes: data.notes,
          billing_differs_from_service: data.billing_differs_from_service,
          deposit_required: data.deposit_required,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customer?.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: 'Success',
        description: 'Customer information updated successfully.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update customer information.',
        variant: 'destructive',
      });
      console.error('Error updating customer:', error);
    },
  });

  const handleDepositToggle = (checked: boolean) => {
    if (!checked) {
      // Turning deposit requirement ON (checked = false means deposit required = true)
      form.setValue('deposit_required', true);
    } else {
      // Turning deposit requirement OFF - show confirmation
      setShowConfirmDialog(true);
    }
  };

  const confirmDepositChange = () => {
    if (confirmText.toLowerCase() === 'no deposit') {
      form.setValue('deposit_required', false);
      setShowConfirmDialog(false);
      setConfirmText('');
      toast({
        title: 'Deposit Requirement Updated',
        description: 'Customer no longer requires a deposit',
      });
    } else {
      toast({
        title: 'Confirmation Failed',
        description: 'Please type "no deposit" exactly to confirm',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: CustomerFormData) => {
    if (customer) {
      updateCustomerMutation.mutate(data);
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  // Sync billing address when toggle changes
  useEffect(() => {
    if (!billingDiffers) {
      form.setValue('billing_address', form.getValues('service_street') + (form.getValues('service_street_2') ? `, ${form.getValues('service_street_2')}` : ''));
      form.setValue('billing_city', form.getValues('service_city'));
      form.setValue('billing_state', form.getValues('service_state'));
      form.setValue('billing_zip', form.getValues('service_zip'));
    }
  }, [billingDiffers, form]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer Information</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CUSTOMER_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter email address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter phone number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* General Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>General Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., gate code is 1234, special access instructions..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Service Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Address</h3>
                
                <FormField
                  control={form.control}
                  name="service_street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 Main St" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service_street_2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address 2</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Apt, Suite, Unit, Building (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="service_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="service_state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.value} - {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="service_zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Billing Address Toggle */}
              <FormField
                control={form.control}
                name="billing_differs_from_service"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Billing address differs from service address
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Conditional Billing Address Fields */}
              {billingDiffers && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Billing Address</h3>
                  
                  <FormField
                    control={form.control}
                    name="billing_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Main St" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="billing_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billing_state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.value} - {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billing_zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="12345" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Deposit Toggle */}
              <FormField
                control={form.control}
                name="deposit_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Deposit not required
                      </FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!field.value}
                        onCheckedChange={handleDepositToggle}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCustomerMutation.isPending}>
                  {updateCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-green-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-800">Confirm No Deposit Required</AlertDialogTitle>
            <AlertDialogDescription className="text-green-600">
              Are you sure this customer does not require a deposit? This will change their credit status.
              <br /><br />
              Type <strong>"no deposit"</strong> to confirm:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Input
              placeholder="Type 'no deposit' to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="border-green-300 focus:border-green-500"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowConfirmDialog(false);
                setConfirmText('');
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDepositChange}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}