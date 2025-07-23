
import React from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const dropPinSchema = z.object({
  service_location_id: z.string().min(1, 'Service location is required'),
  point_name: z.string().min(1, 'Point name is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  category: z.string().optional(),
  description: z.string().optional(),
  is_primary: z.boolean().default(false),
});

type DropPinForm = z.infer<typeof dropPinSchema>;

interface AddDropPinModalProps {
  customerId: string;
  serviceLocations: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'units', label: 'Unit Placement' },
  { value: 'access', label: 'Access Point' },
  { value: 'delivery', label: 'Delivery Zone' },
  { value: 'parking', label: 'Parking Area' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
];

export function AddDropPinModal({ 
  customerId,
  serviceLocations,
  isOpen, 
  onClose, 
  onSuccess 
}: AddDropPinModalProps) {
  const { toast } = useToast();
  
  const form = useForm<DropPinForm>({
    resolver: zodResolver(dropPinSchema),
    defaultValues: {
      service_location_id: '',
      point_name: '',
      latitude: 0,
      longitude: 0,
      category: '',
      description: '',
      is_primary: false,
    },
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
          toast({
            title: "Location captured",
            description: "Current GPS coordinates have been set",
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Error",
            description: "Failed to get current location",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: DropPinForm) => {
    try {
      // If this is being set as primary, remove primary from other coordinates for this location
      if (data.is_primary) {
        await supabase
          .from('service_location_coordinates')
          .update({ is_primary: false })
          .eq('service_location_id', data.service_location_id);
      }

      const { error } = await supabase
        .from('service_location_coordinates')
        .insert({
          service_location_id: data.service_location_id,
          point_name: data.point_name,
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category,
          description: data.description,
          is_primary: data.is_primary,
        });

      if (error) throw error;

      form.reset();
      onSuccess();
    } catch (error) {
      console.error('Error adding drop-pin:', error);
      toast({
        title: "Error",
        description: "Failed to add GPS drop-pin",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add GPS Drop-Pin</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="service_location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Location *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {serviceLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.location_name}
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
              name="point_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Point Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Entrance, Unit Area A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.000001"
                        placeholder="0.000000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.000001"
                        placeholder="0.000000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              className="w-full"
            >
              Use Current Location
            </Button>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional description or notes about this location"
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
              name="is_primary"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Set as Primary GPS Point</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Adding...' : 'Add Drop-Pin'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
