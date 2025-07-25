import React, { useEffect } from 'react';
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

interface AddCustomerModalProps {
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

export function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      type: "",
      email: "",
      phone: "",
      service_street: "",
      service_street2: "",
      service_city: "",
      service_state: "",
      service_zip: "",
      billing_differs_from_service: false,
      billing_street: "",
      billing_street2: "",
      billing_city: "",
      billing_state: "",
      billing_zip: "",
      default_service_differs_from_main: false,
      default_service_street: "",
      default_service_street2: "",
      default_service_city: "",
      default_service_state: "",
      default_service_zip: "",
      deposit_required: true, // Default to ON
    },
  });

  const billingDiffers = form.watch("billing_differs_from_service");
  const defaultServiceDiffers = form.watch("default_service_differs_from_main");

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: CustomerFormData) => {
      const insertData = {
        name: customerData.name,
        customer_type: customerData.type as "events_festivals" | "construction" | "municipal_government" | "private_events_weddings" | "sports_recreation" | "emergency_disaster_relief",
        email: customerData.email || null,
        phone: customerData.phone || null,
        service_street: customerData.service_street,
        service_street2: customerData.service_street2 || null,
        service_city: customerData.service_city,
        service_state: customerData.service_state,
        service_zip: customerData.service_zip,
        billing_differs_from_service: customerData.billing_differs_from_service,
        billing_street: customerData.billing_differs_from_service ? customerData.billing_street : customerData.service_street,
        billing_street2: customerData.billing_differs_from_service ? (customerData.billing_street2 || null) : (customerData.service_street2 || null),
        billing_city: customerData.billing_differs_from_service ? customerData.billing_city : customerData.service_city,
        billing_state: customerData.billing_differs_from_service ? customerData.billing_state : customerData.service_state,
        billing_zip: customerData.billing_differs_from_service ? customerData.billing_zip : customerData.service_zip,
        default_service_differs_from_main: customerData.default_service_differs_from_main,
        default_service_street: customerData.default_service_differs_from_main ? customerData.default_service_street : customerData.service_street,
        default_service_street2: customerData.default_service_differs_from_main ? (customerData.default_service_street2 || null) : (customerData.service_street2 || null),
        default_service_city: customerData.default_service_differs_from_main ? customerData.default_service_city : customerData.service_city,
        default_service_state: customerData.default_service_differs_from_main ? customerData.default_service_state : customerData.service_state,
        default_service_zip: customerData.default_service_differs_from_main ? customerData.default_service_zip : customerData.service_zip,
        deposit_required: customerData.deposit_required,
      };

      const { error } = await supabase
        .from('customers')
        .insert(insertData);

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Success",
        description: "Customer created successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error("Error creating customer:", error);
      toast({
        title: "Error", 
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    createCustomerMutation.mutate(data);
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

  // Sync default service address fields when toggle is disabled
  useEffect(() => {
    if (!defaultServiceDiffers) {
      const serviceValues = form.getValues();
      form.setValue("default_service_street", serviceValues.service_street);
      form.setValue("default_service_street2", serviceValues.service_street2);
      form.setValue("default_service_city", serviceValues.service_city);
      form.setValue("default_service_state", serviceValues.service_state);
      form.setValue("default_service_zip", serviceValues.service_zip);
    }
  }, [defaultServiceDiffers, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
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
            <div className="space-y-6 pt-6 border-t border-border">
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
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-6 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}