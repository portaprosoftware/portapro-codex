
import React, { useEffect, useState } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  is_default: z.boolean().default(false),
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
  const [showDefaultConfirmation, setShowDefaultConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ServiceLocationForm | null>(null);
  
  const form = useForm<ServiceLocationForm>({
    resolver: zodResolver(serviceLocationSchema),
  });

  // Get total location count for this customer
  const { data: locationCount = 0 } = useQuery({
    queryKey: ['customer-service-locations-count', location?.customer_id],
    queryFn: async () => {
      if (!location?.customer_id) return 0;
      const { count } = await supabase
        .from('customer_service_locations')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', location.customer_id);
      return count || 0;
    },
    enabled: !!location?.customer_id && isOpen,
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
        onsite_contact_name: location.onsite_contact_name || '',
        onsite_contact_phone: location.onsite_contact_phone || '',
        is_active: location.is_active ?? true,
        is_default: location.is_default ?? false,
      });
    }
  }, [location, isOpen, form]);

  const performUpdate = async (data: ServiceLocationForm) => {
    try {
      const { error } = await supabase
        .from('customer_service_locations')
        .update(data)
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

  const onSubmit = async (data: ServiceLocationForm) => {
    // If this is the only location, it must be default
    if (locationCount === 1) {
      data.is_default = true;
    }
    
    // If changing to default from non-default, show confirmation
    if (data.is_default && !location.is_default && locationCount > 1) {
      setPendingFormData(data);
      setShowDefaultConfirmation(true);
      return;
    }

    await performUpdate(data);
  };

  const handleConfirmDefaultChange = async () => {
    if (pendingFormData) {
      await performUpdate(pendingFormData);
      setShowDefaultConfirmation(false);
      setPendingFormData(null);
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
                        disabled={location.is_locked}
                      />
                    </FormControl>
                    <FormLabel>Active Location</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={location.is_locked || locationCount === 1} // Can't change if locked or only location
                      />
                    </FormControl>
                    <FormLabel>
                      Set as Default Location
                      {locationCount === 1 && (
                        <span className="text-xs text-muted-foreground ml-1">(only location must be default)</span>
                      )}
                    </FormLabel>
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

      {/* Default Location Change Confirmation */}
      <AlertDialog open={showDefaultConfirmation} onOpenChange={setShowDefaultConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Default Service Location</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to make "{pendingFormData?.location_name}" the default service location for this customer?
              </p>
              <p className="text-yellow-600 font-medium">
                ⚠️ This will remove the default status from the current default location.
              </p>
              <p className="text-sm text-muted-foreground">
                The default service location is used for job scheduling and determines the primary physical address for this customer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDefaultConfirmation(false);
              setPendingFormData(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDefaultChange}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Yes, Change Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
