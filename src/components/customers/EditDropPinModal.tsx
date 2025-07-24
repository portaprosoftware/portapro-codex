
import React, { useEffect, useRef, useState } from 'react';
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
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Crosshair } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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

interface EditDropPinModalProps {
  customerId: string;
  serviceLocations: any[];
  coordinate: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDropPinModal({ 
  customerId,
  serviceLocations,
  coordinate,
  isOpen, 
  onClose, 
  onSuccess 
}: EditDropPinModalProps) {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);

  const getMapStyleUrl = (style: 'satellite' | 'streets') => {
    return style === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'mapbox://styles/mapbox/streets-v12';
  };
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  
  // Load categories for this customer
  const { data: categories = [] } = useQuery({
    queryKey: ['pin-categories', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pin_categories')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen
  });

  const form = useForm<DropPinForm>({
    resolver: zodResolver(dropPinSchema),
    defaultValues: {
      service_location_id: coordinate?.service_location_id || '',
      point_name: coordinate?.point_name || '',
      latitude: coordinate?.latitude || 0,
      longitude: coordinate?.longitude || 0,
      category: coordinate?.category || '',
      description: coordinate?.description || '',
      is_primary: coordinate?.is_primary || false,
    },
  });

  // Fetch Mapbox token
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        toast({
          title: "Error",
          description: "Failed to load map. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (isOpen) {
      getMapboxToken();
    }
  }, [isOpen]);

  // Initialize map when modal opens and token is available
  useEffect(() => {
    if (!isOpen || !mapboxToken || !mapContainer.current || !coordinate) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyleUrl(mapStyle),
      center: [coordinate.longitude, coordinate.latitude],
      zoom: 16
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add draggable marker
    marker.current = new mapboxgl.Marker({ draggable: true })
      .setLngLat([coordinate.longitude, coordinate.latitude])
      .addTo(map.current);

    // Update form values when marker is dragged
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        form.setValue('latitude', parseFloat(lngLat.lat.toFixed(6)));
        form.setValue('longitude', parseFloat(lngLat.lng.toFixed(6)));
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (marker.current) {
        marker.current = null;
      }
    };
  }, [isOpen, mapboxToken, coordinate]);

  // Update map style when changed
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(getMapStyleUrl(mapStyle));
    }
  }, [mapStyle]);

  // Watch for coordinate changes and update marker position
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if ((name === 'latitude' || name === 'longitude') && marker.current && value.latitude && value.longitude) {
        marker.current.setLngLat([value.longitude, value.latitude]);
        if (map.current) {
          map.current.setCenter([value.longitude, value.latitude]);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

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
    if (!coordinate) return;

    try {
      // If this is being set as primary, remove primary from other coordinates for this location
      if (data.is_primary) {
        await supabase
          .from('service_location_coordinates')
          .update({ is_primary: false })
          .eq('service_location_id', data.service_location_id)
          .neq('id', coordinate.id);
      }

      // Get the category color for the pin
      const selectedCategory = categories.find(cat => cat.name === data.category);
      const pinColor = selectedCategory?.color || '#EF4444'; // Default red

      const { error } = await supabase
        .from('service_location_coordinates')
        .update({
          service_location_id: data.service_location_id,
          point_name: data.point_name,
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category,
          description: data.description,
          is_primary: data.is_primary,
          pin_color: pinColor,
        })
        .eq('id', coordinate.id);

      if (error) throw error;

      onSuccess();
    } catch (error) {
      console.error('Error updating drop-pin:', error);
      toast({
        title: "Error",
        description: "Failed to update GPS drop-pin",
        variant: "destructive",
      });
    }
  };

  // More robust filtering to ensure no empty string values
  const validServiceLocations = serviceLocations?.filter(location => {
    if (!location) return false;
    
    const id = location.id;
    const name = location.location_name;
    
    // Ensure both id and name exist and are not empty when converted to string
    return id !== null && 
           id !== undefined && 
           name !== null && 
           name !== undefined &&
           String(id).trim() !== '' && 
           String(name).trim() !== '';
  }) || [];

  const validCategories = categories?.filter(category => {
    if (!category) return false;
    
    const name = category.name;
    return name !== null && 
           name !== undefined && 
           String(name).trim() !== '';
  }) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit GPS Drop-Pin</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Interactive Map</span>
              </div>
              <div className="flex rounded-lg overflow-hidden border text-xs">
                <button 
                  onClick={() => setMapStyle('satellite')}
                  className={`px-2 py-1 ${mapStyle === 'satellite' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                >
                  Satellite
                </button>
                <button 
                  onClick={() => setMapStyle('streets')}
                  className={`px-2 py-1 ${mapStyle === 'streets' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                >
                  Road
                </button>
              </div>
            </div>
            <div 
              ref={mapContainer} 
              className="h-[300px] w-full rounded-lg border"
              style={{ minHeight: '300px' }}
            />
            <div className="text-xs text-muted-foreground">
              Drag the pin to adjust the coordinates
            </div>
          </div>

          {/* Form Section */}
          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="service_location_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Location *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {validServiceLocations.map((location) => (
                            <SelectItem key={location.id} value={String(location.id)}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {validCategories.map((category) => (
                            <SelectItem key={category.id} value={String(category.name)}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </div>
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

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground text-center">
                    Driver On-site? Click to save current coordinates.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="w-full"
                  >
                    <Crosshair className="w-4 h-4 mr-2" />
                    Use Current Location
                  </Button>
                </div>

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
                    {form.formState.isSubmitting ? 'Updating...' : 'Update Drop-Pin'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
