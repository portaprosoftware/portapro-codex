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
import { MapPin, Crosshair, Target, Plus, Save, X } from 'lucide-react';
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

interface AddDropPinModalProps {
  customerId: string;
  serviceLocations: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCoordinates?: { lat: number; lng: number };
}

export function AddDropPinModal({ 
  customerId,
  serviceLocations,
  isOpen, 
  onClose, 
  onSuccess,
  initialCoordinates
}: AddDropPinModalProps) {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const crosshairElement = useRef<HTMLDivElement>(null);

  const getMapStyleUrl = (style: 'satellite' | 'streets') => {
    return style === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'mapbox://styles/mapbox/streets-v12';
  };
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  
  // New state for enhanced GPS workflow
  const [isGpsCaptureMode, setIsGpsCaptureMode] = useState(false);
  const [capturedPins, setCapturedPins] = useState<DropPinForm[]>([]);
  const [currentStep, setCurrentStep] = useState<'locate' | 'details'>('locate');
  const [currentPinData, setCurrentPinData] = useState<Partial<DropPinForm>>({});
  
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
      service_location_id: '',
      point_name: '',
      latitude: initialCoordinates?.lat || 0,
      longitude: initialCoordinates?.lng || 0,
      category: '',
      description: '',
      is_primary: false,
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
    if (!isOpen || !mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Get default coordinates from customer's default service location
    const getDefaultCoordinatesForModal = async (): Promise<[number, number]> => {
      // If initial coordinates provided, use them
      if (initialCoordinates?.lat && initialCoordinates?.lng) {
        return [initialCoordinates.lng, initialCoordinates.lat];
      }
      
      // Try to use primary service location with stored GPS coordinates
      if (serviceLocations && serviceLocations.length > 0) {
        const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
        
        if (primaryLocation && primaryLocation.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
          const [lng, lat] = primaryLocation.gps_coordinates.split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lng, lat];
          }
        }
        
        // If no GPS coordinates, try to geocode the address
        if (primaryLocation && primaryLocation.street && primaryLocation.city && primaryLocation.state && mapboxToken) {
          const fullAddress = [
            primaryLocation.street,
            primaryLocation.street2,
            primaryLocation.city,
            primaryLocation.state,
            primaryLocation.zip
          ].filter(Boolean).join(' ');
          
          try {
            const encodedAddress = encodeURIComponent(fullAddress.trim());
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1&country=us`
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                
                // Store the geocoded coordinates for future use
                try {
                  await supabase
                    .from('customer_service_locations')
                    .update({ 
                      gps_coordinates: `${lng},${lat}` 
                    })
                    .eq('id', primaryLocation.id);
                } catch (error) {
                  console.error('Error storing geocoded coordinates:', error);
                }
                
                return [lng, lat];
              }
            }
          } catch (error) {
            console.error('Geocoding error in modal:', error);
          }
        }
      }
      
      return [-79.9959, 40.4406]; // Default to Pittsburgh
    };

    const initializeModalMap = async () => {
      const [centerLng, centerLat] = await getDefaultCoordinatesForModal();

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: getMapStyleUrl(mapStyle),
        center: [centerLng, centerLat],
        zoom: 16
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add draggable marker at the center coordinates
      marker.current = new mapboxgl.Marker({ draggable: true })
        .setLngLat([centerLng, centerLat])
        .addTo(map.current);

      // Update form values when marker is dragged
      marker.current.on('dragend', () => {
        if (marker.current) {
          const lngLat = marker.current.getLngLat();
          form.setValue('latitude', parseFloat(lngLat.lat.toFixed(6)));
          form.setValue('longitude', parseFloat(lngLat.lng.toFixed(6)));
        }
      });

      // Set form values to the initial coordinates
      form.setValue('latitude', centerLat);
      form.setValue('longitude', centerLng);
    };

    initializeModalMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (marker.current) {
        marker.current = null;
      }
    };
  }, [isOpen, mapboxToken, initialCoordinates]);

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

  // New functions for enhanced GPS workflow
  const startGpsCapture = () => {
    setIsGpsCaptureMode(true);
    setCurrentStep('locate');
    
    // Hide existing marker during GPS capture
    if (marker.current) {
      marker.current.remove();
    }
    
    toast({
      title: "GPS Capture Mode",
      description: "Zoom in and position the map, then click 'Capture This Location'",
    });
  };

  const captureLocationFromMap = () => {
    if (!map.current) return;
    
    const center = map.current.getCenter();
    const capturedData = {
      latitude: parseFloat(center.lat.toFixed(6)),
      longitude: parseFloat(center.lng.toFixed(6)),
    };
    
    setCurrentPinData(capturedData);
    setIsGpsCaptureMode(false);
    setCurrentStep('details');
    
    // Add marker at captured location
    if (map.current) {
      marker.current = new mapboxgl.Marker({ color: '#EF4444' })
        .setLngLat([capturedData.longitude, capturedData.latitude])
        .addTo(map.current);
    }
    
    form.setValue('latitude', capturedData.latitude);
    form.setValue('longitude', capturedData.longitude);
    
    toast({
      title: "Location Captured!",
      description: `Coordinates: ${capturedData.latitude.toFixed(6)}, ${capturedData.longitude.toFixed(6)}`,
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = parseFloat(position.coords.latitude.toFixed(6));
          const lng = parseFloat(position.coords.longitude.toFixed(6));
          
          form.setValue('latitude', lat);
          form.setValue('longitude', lng);
          
          // Center map on current location and add marker
          if (map.current) {
            map.current.setCenter([lng, lat]);
            map.current.setZoom(18);
            
            if (marker.current) {
              marker.current.setLngLat([lng, lat]);
            } else {
              marker.current = new mapboxgl.Marker({ color: '#10B981' })
                .setLngLat([lng, lat])
                .addTo(map.current);
            }
          }
          
          setCurrentPinData({ latitude: lat, longitude: lng });
          setCurrentStep('details');
          
          toast({
            title: "Current Location Captured",
            description: `GPS coordinates: ${lat}, ${lng}`,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Error",
            description: "Failed to get current location. Please try again.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser",
        variant: "destructive",
      });
    }
  };

  const addPinToBatch = async (data: DropPinForm) => {
    const newPin = { ...data };
    setCapturedPins(prev => [...prev, newPin]);
    
    toast({
      title: "Pin Added",
      description: `"${data.point_name}" has been added to the batch`,
    });
    
    // Reset for next pin
    form.reset({
      service_location_id: data.service_location_id, // Keep same location
      point_name: '',
      latitude: 0,
      longitude: 0,
      category: '',
      description: '',
      is_primary: false,
    });
    
    setCurrentStep('locate');
    setCurrentPinData({});
    
    // Remove current marker
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }
  };

  const saveAllPins = async () => {
    if (capturedPins.length === 0) return;
    
    try {
      for (const pinData of capturedPins) {
        // If this is being set as primary, remove primary from other coordinates for this location
        if (pinData.is_primary) {
          await supabase
            .from('service_location_coordinates')
            .update({ is_primary: false })
            .eq('service_location_id', pinData.service_location_id);
        }

        // Get the category color for the pin
        const selectedCategory = categories.find(cat => cat.name === pinData.category);
        const pinColor = selectedCategory?.color || '#EF4444';

        const { error } = await supabase
          .from('service_location_coordinates')
          .insert({
            service_location_id: pinData.service_location_id,
            point_name: pinData.point_name,
            latitude: pinData.latitude,
            longitude: pinData.longitude,
            category: pinData.category,
            description: pinData.description,
            is_primary: pinData.is_primary,
            pin_color: pinColor,
          });

        if (error) throw error;
      }

      toast({
        title: "Success!",
        description: `${capturedPins.length} GPS drop-pins have been saved`,
      });

      // Reset everything
      setCapturedPins([]);
      form.reset();
      setCurrentStep('locate');
      setCurrentPinData({});
      onSuccess();
    } catch (error) {
      console.error('Error saving pins:', error);
      toast({
        title: "Error",
        description: "Failed to save some GPS drop-pins",
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

      // Get the category color for the pin
      const selectedCategory = categories.find(cat => cat.name === data.category);
      const pinColor = selectedCategory?.color || '#EF4444'; // Default red

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
          pin_color: pinColor,
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

  // Ultra-robust filtering with extensive validation and logging
  const validServiceLocations = React.useMemo(() => {
    console.log('Raw serviceLocations:', serviceLocations);
    
    if (!Array.isArray(serviceLocations)) {
      console.warn('serviceLocations is not an array:', serviceLocations);
      return [];
    }
    
    const filtered = serviceLocations.filter((location, index) => {
      console.log(`Checking location ${index}:`, location);
      
      if (!location) {
        console.log(`Location ${index} is null/undefined`);
        return false;
      }
      
      const id = location.id;
      const name = location.location_name;
      
      console.log(`Location ${index} - id:`, id, 'name:', name);
      
      // Check for null/undefined
      if (id === null || id === undefined || name === null || name === undefined) {
        console.log(`Location ${index} has null/undefined values`);
        return false;
      }
      
      // Convert to string and check for empty/whitespace
      const idStr = String(id).trim();
      const nameStr = String(name).trim();
      
      console.log(`Location ${index} - idStr:`, idStr, 'nameStr:', nameStr);
      
      const isValid = idStr !== '' && nameStr !== '' && idStr !== 'null' && idStr !== 'undefined' && nameStr !== 'null' && nameStr !== 'undefined';
      
      if (!isValid) {
        console.log(`Location ${index} failed validation - idStr: "${idStr}", nameStr: "${nameStr}"`);
      }
      
      return isValid;
    });
    
    console.log('Filtered serviceLocations:', filtered);
    return filtered;
  }, [serviceLocations]);

  const validCategories = React.useMemo(() => {
    console.log('Raw categories:', categories);
    
    if (!Array.isArray(categories)) {
      console.warn('categories is not an array:', categories);
      return [];
    }
    
    const filtered = categories.filter((category, index) => {
      console.log(`Checking category ${index}:`, category);
      
      if (!category) {
        console.log(`Category ${index} is null/undefined`);
        return false;
      }
      
      const name = category.name;
      console.log(`Category ${index} - name:`, name);
      
      if (name === null || name === undefined) {
        console.log(`Category ${index} has null/undefined name`);
        return false;
      }
      
      const nameStr = String(name).trim();
      console.log(`Category ${index} - nameStr:`, nameStr);
      
      const isValid = nameStr !== '' && nameStr !== 'null' && nameStr !== 'undefined';
      
      if (!isValid) {
        console.log(`Category ${index} failed validation - nameStr: "${nameStr}"`);
      }
      
      return isValid;
    });
    
    console.log('Filtered categories:', filtered);
    return filtered;
  }, [categories]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Add GPS Drop-Pin
              {capturedPins.length > 0 && (
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {capturedPins.length} pin{capturedPins.length !== 1 ? 's' : ''} ready
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Map Section - Large and prominent */}
            <div className="p-6 pb-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-medium">Interactive Map</span>
                    {isGpsCaptureMode && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full animate-pulse">
                        GPS Capture Mode
                      </span>
                    )}
                  </div>
                  <div className="flex rounded-lg overflow-hidden border text-xs">
                    <button 
                      onClick={() => setMapStyle('satellite')}
                      className={`px-3 py-1.5 ${mapStyle === 'satellite' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
                    >
                      Satellite
                    </button>
                    <button 
                      onClick={() => setMapStyle('streets')}
                      className={`px-3 py-1.5 ${mapStyle === 'streets' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
                    >
                      Streets
                    </button>
                  </div>
                </div>
                
                {/* Map Container with GPS Crosshair Overlay */}
                <div className="relative">
                  <div 
                    ref={mapContainer} 
                    className="h-[450px] w-full rounded-lg border shadow-md"
                    style={{ minHeight: '450px' }}
                  />
                  
                  {/* GPS Crosshair Overlay */}
                  {isGpsCaptureMode && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative">
                        {/* Red Circle */}
                        <div className="w-16 h-16 border-4 border-red-500 rounded-full animate-pulse opacity-80"></div>
                        {/* Crosshair */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-0.5 bg-red-500"></div>
                          <div className="absolute w-0.5 h-8 bg-red-500"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* GPS Action Buttons */}
                {currentStep === 'locate' && (
                  <div className="flex gap-3 justify-center">
                    {!isGpsCaptureMode ? (
                      <>
                        <Button
                          type="button"
                          onClick={startGpsCapture}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Add GPS Point
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                        >
                          <Crosshair className="w-4 h-4 mr-2" />
                          Use Current Location
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={captureLocationFromMap}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 text-white animate-pulse"
                      >
                        <Target className="w-5 h-5 mr-2" />
                        Capture This Location
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Section - Appears after location capture */}
            {currentStep === 'details' && (
              <div className="px-6 pb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <Target className="w-4 h-4" />
                    Location Captured: {currentPinData.latitude?.toFixed(6)}, {currentPinData.longitude?.toFixed(6)}
                  </div>
                </div>

                <Form {...form}>
                  <form 
                    onSubmit={form.handleSubmit((data) => {
                      if (capturedPins.length > 0) {
                        addPinToBatch(data);
                      } else {
                        onSubmit(data);
                      }
                    })} 
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                {validServiceLocations.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    No service locations available
                                  </div>
                                ) : (
                                  validServiceLocations.map((location) => {
                                    const idValue = String(location.id);
                                    
                                    if (!idValue || idValue.trim() === '') {
                                      return null;
                                    }
                                    
                                    return (
                                      <SelectItem key={location.id} value={idValue}>
                                        {location.location_name}
                                      </SelectItem>
                                    );
                                  })
                                )}
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
                    </div>

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {validCategories.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No categories available
                                </div>
                              ) : (
                                validCategories.map((category) => {
                                  const nameValue = String(category.name);
                                  
                                  if (!nameValue || nameValue.trim() === '') {
                                    return null;
                                  }
                                  
                                  return (
                                    <SelectItem key={category.id} value={nameValue}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-3 h-3 rounded-full border"
                                          style={{ backgroundColor: category.color }}
                                        />
                                        {category.name}
                                      </div>
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                        <FormItem className="flex items-center space-x-2 space-y-0">
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

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-6 border-t">
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        {capturedPins.length > 0 && (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={saveAllPins}
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save All ({capturedPins.length}) Pins
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Pin to Map
                        </Button>
                        {capturedPins.length === 0 && (
                          <Button 
                            type="button"
                            onClick={() => form.handleSubmit(onSubmit)()}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={form.formState.isSubmitting}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {form.formState.isSubmitting ? 'Saving...' : 'Save Pin'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {/* Instructions Panel */}
            {currentStep === 'locate' && (
              <div className="px-6 pb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How to Add GPS Drop-Pins:</h4>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. Click "Add GPS Point" to enable targeting mode</li>
                    <li>2. Zoom in and position the map precisely</li>
                    <li>3. Click "Capture This Location" when ready</li>
                    <li>4. Fill in the pin details and save</li>
                    <li>5. Use "Add Another Pin" for multiple locations</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
