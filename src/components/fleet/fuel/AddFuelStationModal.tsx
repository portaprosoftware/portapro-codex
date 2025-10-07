import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AddFuelStationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddFuelStationModal: React.FC<AddFuelStationModalProps> = ({
  open,
  onOpenChange
}) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [zipCodeSearch, setZipCodeSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    default_cost_per_gallon: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addStationMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('fuel_stations')
        .insert({
          name: data.name,
          address: data.address || `${data.street}, ${data.city}, ${data.state} ${data.zip}`,
          street: data.street,
          city: data.city,
          state: data.state,
          zip: data.zip,
          phone: data.phone,
          default_cost_per_gallon: data.default_cost_per_gallon ? parseFloat(data.default_cost_per_gallon) : null,
          notes: data.notes,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Fuel station added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['fuel-stations'] });
      onOpenChange(false);
      setFormData({
        name: '',
        address: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        default_cost_per_gallon: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add fuel station',
        variant: 'destructive'
      });
      console.error('Error adding fuel station:', error);
    }
  });

  // Initialize map when map tab is opened
  useEffect(() => {
    if (!open || activeTab !== "map" || !mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
        
        if (!tokenData?.token) {
          toast({
            title: 'Error',
            description: 'Mapbox token not configured',
            variant: 'destructive'
          });
          return;
        }

        mapboxgl.accessToken = tokenData.token;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-95.7129, 37.0902],
          zoom: 4
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      } catch (error) {
        console.error('Failed to initialize map:', error);
        toast({
          title: 'Error',
          description: 'Failed to load map',
          variant: 'destructive'
        });
      }
    };

    initializeMap();

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [open, activeTab]);

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
    
    try {
      const { data, error } = await supabase.functions.invoke('search-gas-stations', {
        body: { zipCode: zipCodeSearch.trim() }
      });

      if (error) throw error;

      if (data.gasStations && data.gasStations.length > 0) {
        markers.current.forEach(marker => marker.remove());
        markers.current = [];
        
        if (map.current && data.searchCenter) {
          map.current.flyTo({
            center: [data.searchCenter.longitude, data.searchCenter.latitude],
            zoom: 12
          });
        }
        
        data.gasStations.forEach((station: any) => {
          if (!map.current) return;
          
          const el = document.createElement('div');
          el.className = 'gas-station-marker';
          el.style.width = '25px';
          el.style.height = '25px';
          el.style.backgroundColor = 'hsl(var(--primary))';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';
          el.style.cursor = 'pointer';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([station.coordinates.longitude, station.coordinates.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="padding: 8px;">
                    <h3 style="font-weight: bold; margin-bottom: 4px;">${station.name}</h3>
                    <p style="font-size: 12px; margin: 2px 0;">${station.address}</p>
                    <p style="font-size: 12px; margin: 2px 0;">${station.city}, ${station.state} ${station.zip}</p>
                    <p style="font-size: 11px; margin-top: 6px; color: #666;">Click marker to use this station</p>
                  </div>
                `)
            )
            .addTo(map.current);
          
          el.addEventListener('click', () => {
            setFormData({
              name: station.name,
              address: station.address,
              street: station.address,
              city: station.city,
              state: station.state,
              zip: station.zip,
              phone: station.phone || '',
              default_cost_per_gallon: '',
              notes: ''
            });
            setActiveTab("manual");
            toast({
              title: 'Success',
              description: 'Station details loaded! Please review and add cost per gallon.'
            });
          });
          
          markers.current.push(marker);
        });
        
        toast({
          title: 'Success',
          description: `Found ${data.gasStations.length} gas stations`
        });
      } else {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Station name is required',
        variant: 'destructive'
      });
      return;
    }

    addStationMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Add Fuel Station
          </DialogTitle>
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
            
            <div 
              ref={mapContainer} 
              className="w-full h-[450px] rounded-lg border"
            />
            
            <p className="text-sm text-muted-foreground">
              Enter a zip code and click Search to find nearby gas stations. Click any marker on the map to auto-fill the form with that station's details.
            </p>
          </TabsContent>
          
          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Station Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Shell Gas Station"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Full Address (Optional)</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="e.g., 123 Main St, City, State 12345"
            />
          </div>

          <div className="text-sm text-muted-foreground">Or enter address components:</div>

          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                placeholder="12345"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="default-cost">Default Cost/Gallon</Label>
            <Input
              id="default-cost"
              type="number"
              step="0.001"
              value={formData.default_cost_per_gallon}
              onChange={(e) => setFormData(prev => ({ ...prev, default_cost_per_gallon: e.target.value }))}
              placeholder="$0.000"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes about this station..."
              rows={2}
            />
          </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addStationMutation.isPending}
                  className="bg-gradient-to-r from-primary to-primary-variant"
                >
                  {addStationMutation.isPending ? 'Adding...' : 'Add Station'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};