
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { geocodeAddress } from '@/services/geocoding';

const serviceLocationSchema = z.object({
  location_name: z.string().min(1, 'Location name is required'),
  location_description: z.string().optional(),
  street: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  access_instructions: z.string().optional(),
  onsite_contact_name: z.string().optional(),
  onsite_contact_phone: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ServiceLocationForm = z.infer<typeof serviceLocationSchema>;

interface AddServiceLocationModalProps {
  customerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddServiceLocationModal({ 
  customerId, 
  isOpen, 
  onClose, 
  onSuccess 
}: AddServiceLocationModalProps) {
  const { toast } = useToast();
  
  // Get current location count for this customer
  const { data: locationCount = 0 } = useQuery({
    queryKey: ['customer-service-locations-count', customerId],
    queryFn: async () => {
      const { count } = await supabase
        .from('customer_service_locations')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);
      return count || 0;
    },
    enabled: !!customerId && isOpen,
  });
  
  const form = useForm<ServiceLocationForm>({
    resolver: zodResolver(serviceLocationSchema),
    defaultValues: {
      location_name: '',
      location_description: '',
      street: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      access_instructions: '',
      onsite_contact_name: '',
      onsite_contact_phone: '',
      is_active: true,
    },
  });

  const onSubmit = async (data: ServiceLocationForm) => {
    try {
      // Get Mapbox token and geocode the address
      const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
      let gpsCoordinates = null;

      if (tokenData?.token) {
        const fullAddress = `${data.street} ${data.street2 || ''} ${data.city} ${data.state} ${data.zip}`.trim();
        const coordinates = await geocodeAddress(fullAddress, tokenData.token);
        if (coordinates) {
          gpsCoordinates = `point(${coordinates[0]} ${coordinates[1]})`;
        }
      }

      const { error } = await supabase
        .from('customer_service_locations')
        .insert({
          customer_id: customerId,
          location_name: data.location_name,
          location_description: data.location_description,
          street: data.street,
          street2: data.street2,
          city: data.city,
          state: data.state,
          zip: data.zip,
          access_instructions: data.access_instructions,
          contact_person: data.onsite_contact_name,
          contact_phone: data.onsite_contact_phone,
          is_active: data.is_active,
          is_default: false, // Never default - only the customer service address is default
          gps_coordinates: gpsCoordinates,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service location added successfully",
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error adding service location:', error);
      toast({
        title: "Error",
        description: "Failed to add service location",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service Location</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location_name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Location Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Office, Warehouse A, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location_description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Optional description of this location"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="street2"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Suite, Unit, Apt, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="access_instructions"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Access Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Gate codes, entry instructions, parking notes, etc."
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="onsite_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Onsite Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact person at this location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="onsite_contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Onsite Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-6 pt-4">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Active Location</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Adding...' : 'Add Location'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
