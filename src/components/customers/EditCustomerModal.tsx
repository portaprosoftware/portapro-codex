import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
  name: z.string().min(1, "Company name is required"),
  contact_first_name: z.string().min(1, "First name is required"),
  contact_last_name: z.string().min(1, "Last name is required"),
  type: z.string().min(1, "Customer type is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  service_street: z.string().min(1, "Service street is required"),
  service_street2: z.string().optional(),
  service_city: z.string().min(1, "Service city is required"),
  service_state: z.string().min(1, "Service state is required"),
  service_zip: z.string().min(1, "Service ZIP is required"),
  billing_differs_from_service: z.boolean().default(false),
  billing_street: z.string().optional(),
  billing_street2: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_zip: z.string().optional(),
  default_service_differs_from_main: z.boolean().default(false),
  default_service_street: z.string().optional(),
  default_service_street2: z.string().optional(),
  default_service_city: z.string().optional(),
  default_service_state: z.string().optional(),
  default_service_zip: z.string().optional(),
  deposit_required: z.boolean().default(false),
}).refine((data) => {
  if (data.billing_differs_from_service) {
    return data.billing_street && data.billing_city && data.billing_state && data.billing_zip;
  }
  return true;
}, {
  message: "All billing address fields are required when billing differs from service address",
  path: ["billing_street"],
}).refine((data) => {
  if (data.default_service_differs_from_main) {
    return data.default_service_street && data.default_service_city && data.default_service_state && data.default_service_zip;
  }
  return true;
}, {
  message: "All default service address fields are required when default service differs from main address",
  path: ["default_service_street"],
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  contact_first_name: string;
  contact_last_name: string;
  type: string;
  email?: string;
  phone?: string;
  service_street: string;
  service_street2?: string;
  service_city: string;
  service_state: string;
  service_zip: string;
  billing_differs_from_service?: boolean;
  billing_street?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  default_service_differs_from_main?: boolean;
  default_service_street?: string;
  default_service_street2?: string;
  default_service_city?: string;
  default_service_state?: string;
  default_service_zip?: string;
  deposit_required?: boolean;
  created_at: string;
  updated_at: string;
}

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

const CUSTOMER_TYPES = [
  { value: 'events_festivals', label: 'Events & Festivals' },
  { value: 'construction', label: 'Construction' },
  { value: 'municipal_government', label: 'Municipal & Government' },
  { value: 'private_events_weddings', label: 'Private Events & Weddings' },
  { value: 'sports_recreation', label: 'Sports & Recreation' },
  { value: 'emergency_disaster_relief', label: 'Emergency & Disaster Relief' },
];

export function EditCustomerModal({ isOpen, onClose, customer }: EditCustomerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDepositConfirm, setShowDepositConfirm] = useState(false);
  const [depositConfirmText, setDepositConfirmText] = useState('');

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      contact_first_name: customer?.contact_first_name || "",
      contact_last_name: customer?.contact_last_name || "",
      type: customer?.type || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      service_street: customer?.service_street || "",
      service_street2: customer?.service_street2 || "",
      service_city: customer?.service_city || "",
      service_state: customer?.service_state || "",
      service_zip: customer?.service_zip || "",
      billing_differs_from_service: customer?.billing_differs_from_service || false,
      billing_street: customer?.billing_street || "",
      billing_street2: customer?.billing_street2 || "",
      billing_city: customer?.billing_city || "",
      billing_state: customer?.billing_state || "",
      billing_zip: customer?.billing_zip || "",
      default_service_differs_from_main: customer?.default_service_differs_from_main || false,
      default_service_street: customer?.default_service_street || "",
      default_service_street2: customer?.default_service_street2 || "",
      default_service_city: customer?.default_service_city || "",
      default_service_state: customer?.default_service_state || "",
      default_service_zip: customer?.default_service_zip || "",
      deposit_required: customer?.deposit_required || false,
    },
  });

  const billingDiffers = form.watch("billing_differs_from_service");
  const defaultServiceDiffers = form.watch("default_service_differs_from_main");

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const { data: result, error } = await supabase
        .from('customers')
        .update({
          name: data.name,
          contact_first_name: data.contact_first_name,
          contact_last_name: data.contact_last_name,
          type: data.type,
          email: data.email || null,
          phone: data.phone || null,
          service_street: data.service_street,
          service_street2: data.service_street2 || null,
          service_city: data.service_city,
          service_state: data.service_state,
          service_zip: data.service_zip,
          billing_differs_from_service: data.billing_differs_from_service,
          billing_street: data.billing_differs_from_service ? data.billing_street : data.service_street,
          billing_street2: data.billing_differs_from_service ? (data.billing_street2 || null) : (data.service_street2 || null),
          billing_city: data.billing_differs_from_service ? data.billing_city : data.service_city,
          billing_state: data.billing_differs_from_service ? data.billing_state : data.service_state,
          billing_zip: data.billing_differs_from_service ? data.billing_zip : data.service_zip,
          default_service_differs_from_main: data.default_service_differs_from_main,
          default_service_street: data.default_service_differs_from_main ? data.default_service_street : null,
          default_service_street2: data.default_service_differs_from_main ? (data.default_service_street2 || null) : null,
          default_service_city: data.default_service_differs_from_main ? data.default_service_city : null,
          default_service_state: data.default_service_differs_from_main ? data.default_service_state : null,
          default_service_zip: data.default_service_differs_from_main ? data.default_service_zip : null,
          deposit_required: data.deposit_required,
        })
        .eq('id', customer.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer updated successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update customer.",
        variant: "destructive",
      });
      console.error("Error updating customer:", error);
    },
  });

  const handleDepositToggle = (checked: boolean) => {
    if (!checked) {
      // Turning deposit requirement off - show confirmation
      setShowDepositConfirm(true);
    } else {
      form.setValue('deposit_required', true);
    }
  };

  const confirmDepositChange = () => {
    if (depositConfirmText.toLowerCase() === 'no deposit') {
      form.setValue('deposit_required', false);
      setShowDepositConfirm(false);
      setDepositConfirmText('');
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

  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      // Perform cascading deletion of all related records
      
      // Delete customer contacts first
      const { error: contactsError } = await supabase
        .from('customer_contacts')
        .delete()
        .eq('customer_id', customer.id);
      
      if (contactsError) {
        console.error('Error deleting customer contacts:', contactsError);
        throw new Error('Failed to delete customer contacts');
      }

      // Delete customer service locations
      const { error: locationsError } = await supabase
        .from('customer_service_locations')
        .delete()
        .eq('customer_id', customer.id);
      
      if (locationsError) {
        console.error('Error deleting customer service locations:', locationsError);
        throw new Error('Failed to delete customer service locations');
      }

      // Delete customer communications
      const { error: communicationsError } = await supabase
        .from('customer_communications')
        .delete()
        .eq('customer_id', customer.id);
      
      if (communicationsError) {
        console.error('Error deleting customer communications:', communicationsError);
        throw new Error('Failed to delete customer communications');
      }

      // Delete quotes associated with this customer
      const { error: quotesError } = await supabase
        .from('quotes')
        .delete()
        .eq('customer_id', customer.id);
      
      if (quotesError) {
        console.error('Error deleting quotes:', quotesError);
        throw new Error('Failed to delete customer quotes');
      }

      // Delete invoices associated with this customer
      const { error: invoicesError } = await supabase
        .from('invoices')
        .delete()
        .eq('customer_id', customer.id);
      
      if (invoicesError) {
        console.error('Error deleting invoices:', invoicesError);
        throw new Error('Failed to delete customer invoices');
      }

      // Delete jobs associated with this customer
      const { error: jobsError } = await supabase
        .from('jobs')
        .delete()
        .eq('customer_id', customer.id);
      
      if (jobsError) {
        console.error('Error deleting jobs:', jobsError);
        throw new Error('Failed to delete customer jobs');
      }

      // Finally, delete the customer record
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (customerError) {
        console.error('Error deleting customer:', customerError);
        throw new Error('Failed to delete customer');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: 'Customer Deleted',
        description: 'Customer has been permanently deleted.',
        variant: 'destructive',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete customer. They may have associated data.',
        variant: 'destructive',
      });
      console.error('Error deleting customer:', error);
    },
  });

  const handleDeleteCustomer = () => {
    if (deleteConfirmText.toLowerCase() === 'delete customer') {
      deleteCustomerMutation.mutate();
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    } else {
      toast({
        title: 'Confirmation Failed',
        description: 'Please type "delete customer" exactly to confirm',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: CustomerFormData) => {
    updateCustomerMutation.mutate(data);
  };

  // Sync billing address fields when toggle is disabled
  useEffect(() => {
    if (!billingDiffers) {
      const serviceValues = form.getValues();
      form.setValue("billing_street", serviceValues.service_street);
      form.setValue("billing_street2", serviceValues.service_street2);
      form.setValue("billing_city", serviceValues.service_city);
      form.setValue("billing_state", serviceValues.service_state);
      form.setValue("billing_zip", serviceValues.service_zip);
    }
  }, [billingDiffers, form]);

  // Clear default service address fields when toggle is disabled
  useEffect(() => {
    if (!defaultServiceDiffers) {
      form.setValue("default_service_street", "");
      form.setValue("default_service_street2", "");
      form.setValue("default_service_city", "");
      form.setValue("default_service_state", "");
      form.setValue("default_service_zip", "");
    }
  }, [defaultServiceDiffers, form]);

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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Type *</FormLabel>
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
                    name="contact_first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                          <Input {...field} type="email" />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Service Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="service_street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_street2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address 2</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                                {state.label}
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Billing Address Toggle */}
              <div className="space-y-4 pt-6 border-t border-border">
                <FormField
                  control={form.control}
                  name="billing_differs_from_service"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Billing address is different</FormLabel>
                        <FormDescription>
                          Use a different address for billing
                        </FormDescription>
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
              </div>

              {/* Billing Address Fields */}
              {billingDiffers && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <h4 className="text-sm font-medium text-muted-foreground">Billing Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="billing_street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billing_street2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address 2</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billing_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                                  {state.label}
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
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Default Service Address Toggle */}
              <div className="space-y-4 pt-6 border-t border-border">
                <FormField
                  control={form.control}
                  name="default_service_differs_from_main"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Default service address is different</FormLabel>
                        <FormDescription>
                          Use a different address for the default service location
                        </FormDescription>
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
              </div>

              {/* Default Service Address Fields */}
              {defaultServiceDiffers && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <h4 className="text-sm font-medium text-muted-foreground">Default Service Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="default_service_street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="default_service_street2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address 2</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="default_service_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="default_service_state"
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
                                  {state.label}
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
                      name="default_service_zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Deposit Requirement */}
              <div className="space-y-4 pt-6 border-t border-border">
                <FormField
                  control={form.control}
                  name="deposit_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Deposit Required</FormLabel>
                        <FormDescription>
                          Require a deposit for this customer
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={handleDepositToggle}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Danger Zone */}
              <div className="space-y-6 pt-6 border-t border-destructive/20">
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete a customer, there is no going back. Please be certain.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Customer
                  </Button>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-6 border-t border-border">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCustomerMutation.isPending}>
                  {updateCustomerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium">
              Type "delete customer" to confirm:
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete customer"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deposit Confirmation Dialog */}
      <AlertDialog open={showDepositConfirm} onOpenChange={setShowDepositConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Deposit Requirement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the deposit requirement for this customer.
              Type "no deposit" to confirm this change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium">
              Type "no deposit" to confirm:
            </label>
            <Input
              value={depositConfirmText}
              onChange={(e) => setDepositConfirmText(e.target.value)}
              placeholder="no deposit"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDepositChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}