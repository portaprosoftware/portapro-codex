import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const serviceLocationSchema = z.object({
  location_name: z.string().min(1, 'Location name is required'),
  location_description: z.string().optional(),
  street: z.string().min(1, 'Street address is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  access_instructions: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ServiceLocationForm = z.infer<typeof serviceLocationSchema>;

interface EditServiceLocationModalProps {
  location: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditServiceLocationModal({ 
  location,
  isOpen, 
  onClose, 
  onSuccess 
}: EditServiceLocationModalProps) {
  const { toast } = useToast();
  
  const form = useForm<ServiceLocationForm>({
    resolver: zodResolver(serviceLocationSchema),
  });

  useEffect(() => {
    if (location && isOpen) {
      form.reset({
        location_name: location.location_name || '',
        location_description: location.location_description || '',
        street: location.street || '',
        street2: location.street2 || '',
        city: location.city || '',
        state: location.state || '',
        zip: location.zip || '',
        access_instructions: location.access_instructions || '',
        contact_person: location.contact_person || '',
        contact_phone: location.contact_phone || '',
        is_active: location.is_active ?? true,
      });
    }
  }, [location, isOpen, form]);

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

      const updateData = {
        ...data,
        ...(gpsCoordinates && { gps_coordinates: gpsCoordinates })
      };

      const { error } = await supabase
        .from('customer_service_locations')
        .update(updateData)
        .eq('id', location.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service location updated successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating service location:', error);
      toast({
        title: "Error",
        description: "Failed to update service location",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Location</DialogTitle>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border shadow-sm z-50">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border shadow-lg z-50">
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
                name="contact_person"
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
                name="contact_phone"
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
                        disabled={location.is_locked}
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
                {form.formState.isSubmitting ? 'Updating...' : 'Update Location'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}