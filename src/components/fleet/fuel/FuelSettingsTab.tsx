import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Edit, Trash2, MapPin, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StateScroller } from '@/components/ui/state-scroller';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { geocodeAddress } from '@/services/geocoding';

interface FuelSettings {
  id: string;
  fuel_unit: string;
  currency_format: string;
  odometer_precision: number;
  require_receipt: boolean;
  driver_edit_permission: boolean;
  manager_approval_threshold: number;
  auto_calculate_mpg: boolean;
  default_fuel_station_id: string;
}

export const FuelSettingsTab: React.FC = () => {
  const [localSettings, setLocalSettings] = useState<Partial<FuelSettings>>({});
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [zipCodeSearch, setZipCodeSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [stationFormData, setStationFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });
  const [mapCoordinates, setMapCoordinates] = useState<[number, number] | null>(null);
  const mapPreviewContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mapboxToken, setMapboxToken] = useState<string>('');

  // Fetch fuel settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['fuel-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as FuelSettings;
    }
  });

  // Initialize local settings when data loads
  React.useEffect(() => {
    if (settings && Object.keys(localSettings).length === 0) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('🗺️ Fetching Mapbox token from Supabase function...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('🗺️ Error fetching Mapbox token:', error);
          toast({
            title: 'Map Configuration Error',
            description: 'Failed to load map token. Map features may not work.',
            variant: 'destructive'
          });
          return;
        }
        
        if (data?.token) {
          console.log('🗺️ Mapbox token received successfully');
          setMapboxToken(data.token);
        } else {
          console.error('🗺️ No token in response:', data);
          toast({
            title: 'Map Configuration Error',
            description: 'Mapbox token not configured. Please contact support.',
            variant: 'destructive'
          });
        }
      } catch (err) {
        console.error('🗺️ Exception fetching Mapbox token:', err);
        toast({
          title: 'Map Configuration Error',
          description: 'Failed to initialize map. Please refresh the page.',
          variant: 'destructive'
        });
      }
    };
    
    fetchMapboxToken();
  }, []);

  // Fetch fuel stations with full data
  const { data: fuelStations = [], isLoading: stationsLoading } = useQuery({
    queryKey: ['fuel-stations', 'full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_stations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const addStationMutation = useMutation({
    mutationFn: async (stationData: any) => {
      // Ensure we're saving to the correct columns
      const dataToSave = {
        name: stationData.name,
        address: stationData.address,
        street: stationData.address, // Save to both for compatibility
        city: stationData.city,
        state: stationData.state,
        zip: stationData.zip
      };
      
      if (editingStation) {
        const { error } = await supabase
          .from('fuel_stations')
          .update(dataToSave)
          .eq('id', editingStation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fuel_stations')
          .insert(dataToSave);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: editingStation ? 'Station updated successfully' : 'Station added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations', 'full'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations', 'basic'] });
      setShowStationModal(false);
      setEditingStation(null);
      setStationFormData({ name: '', address: '', city: '', state: '', zip: '' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save station',
        variant: 'destructive'
      });
    }
  });

  const deleteStationMutation = useMutation({
    mutationFn: async (stationId: string) => {
      const { error } = await supabase
        .from('fuel_stations')
        .delete()
        .eq('id', stationId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Station deleted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations', 'full'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations', 'basic'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete station',
        variant: 'destructive'
      });
    }
  });

  // Geocode address only when all fields are complete
  useEffect(() => {
    const geocodeStationAddress = async () => {
      const { address, city, state, zip } = stationFormData;
      
      // Only geocode if ALL required fields are filled
      if (!address || !city || !state || !zip) {
        setMapCoordinates(null);
        return;
      }
      
      const fullAddress = `${address}, ${city}, ${state} ${zip}`;
      const coordinates = await geocodeAddress(fullAddress, mapboxToken);
      if (coordinates) {
        setMapCoordinates(coordinates);
      }
    };

    if (showStationModal) {
      geocodeStationAddress();
    }
  }, [stationFormData.address, stationFormData.city, stationFormData.state, stationFormData.zip, showStationModal]);


  // Initialize map for Manual Entry tab when coordinates are available
  useEffect(() => {
    if (!showStationModal || activeTab !== "manual" || !mapPreviewContainer.current || !mapCoordinates) {
      console.log('🗺️ Preview map: Skipping initialization', { 
        showStationModal, 
        activeTab, 
        hasContainer: !!mapPreviewContainer.current,
        hasCoordinates: !!mapCoordinates
      });
      return;
    }

    if (!mapboxToken) {
      console.log('🗺️ Preview map: No Mapbox token yet, waiting...');
      return;
    }

    console.log('🗺️ Preview map: Initializing with coordinates:', mapCoordinates);
    
    // Log container dimensions
    const rect = mapPreviewContainer.current.getBoundingClientRect();
    console.log('🗺️ Preview map container dimensions:', {
      width: rect.width,
      height: rect.height,
      visible: rect.width > 0 && rect.height > 0
    });

    // Clean up existing map
    if (map.current) {
      console.log('🗺️ Preview map: Cleaning up existing map');
      map.current.remove();
      map.current = null;
    }

    try {
      // Initialize new map
      mapboxgl.accessToken = mapboxToken;
      console.log('🗺️ Preview map: Creating Mapbox instance...');
      
      map.current = new mapboxgl.Map({
        container: mapPreviewContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: mapCoordinates,
        zoom: 14
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        console.log('🗺️ Preview map: Map loaded successfully!');
        requestAnimationFrame(() => {
          map.current?.resize();
          console.log('🗺️ Preview map: Resized after load');
        });
        setTimeout(() => {
          map.current?.resize();
          console.log('🗺️ Preview map: Resized with delay');
        }, 100);
      });

      map.current.on('error', (e) => {
        console.error('🗺️ Preview map: Mapbox error:', e.error);
        toast({
          title: 'Map Error',
          description: 'Failed to load preview map.',
          variant: 'destructive'
        });
      });

      // Add marker
      marker.current = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat(mapCoordinates)
        .addTo(map.current);

      console.log('🗺️ Preview map: Map and marker created successfully');
    } catch (err) {
      console.error('🗺️ Preview map: Exception during initialization:', err);
      toast({
        title: 'Map Initialization Error',
        description: 'Failed to create preview map.',
        variant: 'destructive'
      });
    }

    return () => {
      console.log('🗺️ Preview map: Cleanup triggered');
      marker.current?.remove();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [mapCoordinates, showStationModal, activeTab, mapboxToken]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (marker.current && mapCoordinates && map.current) {
      marker.current.setLngLat(mapCoordinates);
      map.current.flyTo({ center: mapCoordinates, zoom: 14 });
    }
  }, [mapCoordinates]);

  const handleEditStation = (station: any) => {
    setEditingStation(station);
    setStationFormData({
      name: station.name || '',
      address: station.address || station.street || '',
      city: station.city || '',
      state: station.state || '',
      zip: station.zip || ''
    });
    setShowStationModal(true);
  };

  const handleAddStation = () => {
    setEditingStation(null);
    setStationFormData({ name: '', address: '', city: '', state: '', zip: '' });
    setMapCoordinates(null);
    setShowStationModal(true);
  };

  const handleSaveStation = () => {
    if (!stationFormData.name) {
      toast({
        title: 'Validation Error',
        description: 'Station name is required',
        variant: 'destructive'
      });
      return;
    }
    addStationMutation.mutate(stationFormData);
  };

  const handleSearchGasStations = async () => {
    if (!zipCodeSearch.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a zip code',
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-gas-stations', {
        body: { zipCode: zipCodeSearch.trim() }
      });

      if (error) throw error;

      if (data.gasStations && data.gasStations.length > 0) {
        setSearchResults(data.gasStations);
        toast({
          title: 'Success',
          description: `Found ${data.gasStations.length} gas stations`
        });
      } else {
        setSearchResults([]);
        toast({
          title: 'No Results',
          description: 'No gas stations found for this zip code'
        });
      }
    } catch (error) {
      console.error('Error searching gas stations:', error);
      toast({
        title: 'Error',
        description: 'Failed to search gas stations',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStation = (station: any) => {
    setStationFormData({
      name: station.name,
      address: station.address,
      city: station.city,
      state: station.state,
      zip: station.zip
    });
    
    // Store coordinates if available
    if (station.coordinates) {
      setMapCoordinates([station.coordinates.longitude, station.coordinates.latitude]);
    }
    
    setActiveTab("manual");
    toast({
      title: 'Station Selected',
      description: 'Review the details and click Save to add this station.'
    });
  };



  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<FuelSettings>) => {
      // Add minimum loading duration to prevent flash
      const [result] = await Promise.all([
        (async () => {
          if (settings?.id) {
            const { error } = await supabase
              .from('fuel_settings')
              .update(newSettings)
              .eq('id', settings.id);
            
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('fuel_settings')
              .insert(newSettings);
            
            if (error) throw error;
          }
        })(),
        // Minimum 600ms loading time
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Settings updated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-settings'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    }
  });

  // Separate mutations for each toggle to prevent interference
  const updateRequireReceiptMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('fuel_settings')
          .update({ require_receipt: checked })
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fuel_settings')
          .insert({ require_receipt: checked });
        
        if (error) throw error;
      }
    },
    onMutate: async (checked) => {
      await queryClient.cancelQueries({ queryKey: ['fuel-settings'] });
      const previousSettings = queryClient.getQueryData(['fuel-settings']);
      
      queryClient.setQueryData(['fuel-settings'], (old: any) => ({
        ...old,
        require_receipt: checked
      }));
      
      return { previousSettings };
    },
    onError: (err, newValue, context) => {
      queryClient.setQueryData(['fuel-settings'], context?.previousSettings);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-settings'] });
    }
  });

  const updateDriverEditMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('fuel_settings')
          .update({ driver_edit_permission: checked })
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fuel_settings')
          .insert({ driver_edit_permission: checked });
        
        if (error) throw error;
      }
    },
    onMutate: async (checked) => {
      await queryClient.cancelQueries({ queryKey: ['fuel-settings'] });
      const previousSettings = queryClient.getQueryData(['fuel-settings']);
      
      queryClient.setQueryData(['fuel-settings'], (old: any) => ({
        ...old,
        driver_edit_permission: checked
      }));
      
      return { previousSettings };
    },
    onError: (err, newValue, context) => {
      queryClient.setQueryData(['fuel-settings'], context?.previousSettings);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-settings'] });
    }
  });

  const updateAutoMpgMutation = useMutation({
    mutationFn: async (checked: boolean) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('fuel_settings')
          .update({ auto_calculate_mpg: checked })
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fuel_settings')
          .insert({ auto_calculate_mpg: checked });
        
        if (error) throw error;
      }
    },
    onMutate: async (checked) => {
      await queryClient.cancelQueries({ queryKey: ['fuel-settings'] });
      const previousSettings = queryClient.getQueryData(['fuel-settings']);
      
      queryClient.setQueryData(['fuel-settings'], (old: any) => ({
        ...old,
        auto_calculate_mpg: checked
      }));
      
      return { previousSettings };
    },
    onError: (err, newValue, context) => {
      queryClient.setQueryData(['fuel-settings'], context?.previousSettings);
      toast({
        title: 'Error',
        description: 'Failed to update setting',
        variant: 'destructive'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-settings'] });
    }
  });


  const handleSaveSettings = () => {
    if (localSettings && Object.keys(localSettings).length > 0) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  if (settingsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Default Units & Formats */}
      <Card>
        <CardHeader>
          <CardTitle>Default Units & Formats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fuel-unit">Fuel Unit</Label>
              <Select 
                value={localSettings?.fuel_unit || 'gallons'} 
                onValueChange={(value) => setLocalSettings(prev => ({ ...prev, fuel_unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gallons">Gallons (US)</SelectItem>
                  <SelectItem value="liters">Liters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency">Currency Format</Label>
              <Select 
                value={localSettings?.currency_format || 'USD'} 
                onValueChange={(value) => setLocalSettings(prev => ({ ...prev, currency_format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="odometer-precision">Odometer Precision</Label>
              <Select 
                value={localSettings?.odometer_precision?.toString() || '0'} 
                onValueChange={(value) => setLocalSettings(prev => ({ ...prev, odometer_precision: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Whole numbers</SelectItem>
                  <SelectItem value="1">One decimal place</SelectItem>
                  <SelectItem value="2">Two decimal places</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="approval-threshold">Manager Approval Threshold ($)</Label>
              <Input
                id="approval-threshold"
                type="number"
                step="0.01"
                value={localSettings?.manager_approval_threshold || ''}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, manager_approval_threshold: parseFloat(e.target.value) }))}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="require-receipt">Require Receipt Upload</Label>
              <p className="text-sm text-muted-foreground">Force drivers to upload receipt photos</p>
            </div>
            <Switch
              id="require-receipt"
              checked={settings?.require_receipt || false}
              onCheckedChange={(checked) => updateRequireReceiptMutation.mutate(checked)}
              disabled={updateRequireReceiptMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="driver-edit">Allow Driver Editing</Label>
              <p className="text-sm text-muted-foreground">Let drivers edit their fuel logs</p>
            </div>
            <Switch
              id="driver-edit"
              checked={settings?.driver_edit_permission || false}
              onCheckedChange={(checked) => updateDriverEditMutation.mutate(checked)}
              disabled={updateDriverEditMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-mpg">Auto-Calculate MPG</Label>
              <p className="text-sm text-muted-foreground">Automatically calculate MPG from odometer readings</p>
            </div>
            <Switch
              id="auto-mpg"
              checked={settings?.auto_calculate_mpg || false}
              onCheckedChange={(checked) => updateAutoMpgMutation.mutate(checked)}
              disabled={updateAutoMpgMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fuel Stations Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fuel Stations</CardTitle>
            <Button onClick={handleAddStation} size="sm" className="bg-gradient-to-r from-primary to-primary-variant">
              <Plus className="h-4 w-4 mr-2" />
              Add Station
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stationsLoading ? (
            <LoadingSpinner />
          ) : fuelStations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Zip</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelStations.map((station: any) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell>{station.address || station.street || '-'}</TableCell>
                    <TableCell>{station.city || '-'}</TableCell>
                    <TableCell>{station.state || '-'}</TableCell>
                    <TableCell>{station.zip || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStation(station)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteStationMutation.mutate(station.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No fuel stations found. Add your first station to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Settings Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="bg-gradient-to-r from-primary to-primary-variant"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Add/Edit Station Modal */}
      <Dialog open={showStationModal} onOpenChange={setShowStationModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {editingStation ? 'Edit Fuel Station' : 'Add Fuel Station'}
            </DialogTitle>
            <DialogDescription>
              Add or search for a station. Use Search Map to find by ZIP and click a marker to auto-fill.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="map">
                <MapPin className="h-4 w-4 mr-2" />
                Search Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter zip code to search"
                    value={zipCodeSearch}
                    onChange={(e) => setZipCodeSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchGasStations()}
                  />
                </div>
                <Button 
                  type="button"
                  onClick={handleSearchGasStations}
                  disabled={isSearching}
                  className="bg-gradient-to-r from-primary to-primary-variant"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
              
              {/* Station Results List */}
              {searchResults.length > 0 ? (
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
                  {searchResults.map((station, index) => (
                    <Card 
                      key={index}
                      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                      onClick={() => handleSelectStation(station)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-1">{station.name}</h4>
                            <p className="text-sm text-muted-foreground">{station.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {station.city}, {station.state} {station.zip}
                            </p>
                            {station.phone && (
                              <p className="text-sm text-muted-foreground mt-1">
                                📞 {station.phone}
                              </p>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectStation(station);
                            }}
                          >
                            Select
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/20">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No stations found</p>
                  <p className="text-sm mt-1">Enter a zip code above and click Search to find nearby gas stations</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="manual">
          <div className="space-y-4">
            <div>
              <Label htmlFor="station-name">Station Name *</Label>
              <Input
                id="station-name"
                value={stationFormData.name}
                onChange={(e) => setStationFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Shell, Chevron, BP"
              />
            </div>
            <div>
              <Label htmlFor="station-address">Address</Label>
              <Input
                id="station-address"
                value={stationFormData.address}
                onChange={(e) => setStationFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="station-city">City</Label>
                <Input
                  id="station-city"
                  value={stationFormData.city}
                  onChange={(e) => setStationFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="station-state">State</Label>
                <StateScroller
                  value={stationFormData.state}
                  onValueChange={(value) => setStationFormData(prev => ({ ...prev, state: value }))}
                  placeholder="State"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="station-zip">Zip Code</Label>
              <Input
                id="station-zip"
                value={stationFormData.zip}
                onChange={(e) => setStationFormData(prev => ({ ...prev, zip: e.target.value }))}
                placeholder="Zip code"
              />
            </div>

            {/* Map View */}
            {mapCoordinates && stationFormData.address && stationFormData.city && stationFormData.state && stationFormData.zip ? (
              <div className="space-y-2">
                <Label>Location Preview</Label>
                <div 
                  ref={mapPreviewContainer} 
                  className="w-full h-64 rounded-lg border border-border"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStationModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveStation}
              disabled={addStationMutation.isPending}
              className="bg-gradient-to-r from-primary to-primary-variant"
            >
              {addStationMutation.isPending ? 'Saving...' : 'Save Station'}
            </Button>
          </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};