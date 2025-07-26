import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MapPin, Navigation, Phone, Package, Calendar, Clock, Radar } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface InventoryLocation {
  id: string;
  product_name: string;
  item_code: string;
  status: string;
  customer_name: string;
  customer_address: string;
  latitude?: number;
  longitude?: number;
  job_type: string;
  scheduled_date: string;
  customer_phone?: string;
  quantity: number;
}

const statusColors = {
  assigned: 'bg-blue-500',
  delivered: 'bg-green-500',
  in_service: 'bg-yellow-500',
  maintenance: 'bg-red-500',
  available: 'bg-gray-500'
};

const statusLabels = {
  assigned: 'Assigned',
  delivered: 'Delivered',
  in_service: 'In Service',
  maintenance: 'Maintenance',
  available: 'Available'
};

export const InventoryMapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocation | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [radarEnabled, setRadarEnabled] = useState(false);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          setShowTokenInput(true);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        setShowTokenInput(true);
      }
    };
    
    fetchMapboxToken();
  }, []);

  // Fetch inventory locations
  const { data: inventoryLocations, isLoading } = useQuery({
    queryKey: ['inventory-locations'],
    queryFn: async (): Promise<InventoryLocation[]> => {
      const { data: assignments } = await supabase
        .from('equipment_assignments')
        .select(`
          id,
          product_id,
          product_item_id,
          quantity,
          status,
          jobs (
            id,
            job_type,
            scheduled_date,
            customers (
              id,
              name,
              service_street,
              service_city,
              service_state,
              service_zip,
              phone,
              customer_service_locations (
                id,
                gps_coordinates,
                service_location_coordinates (
                  latitude,
                  longitude,
                  is_primary
                )
              )
            )
          ),
          products (
            name
          ),
          product_items (
            item_code
          )
        `)
        .in('status', ['assigned', 'delivered', 'in_service']);

      if (!assignments) return [];

      return assignments
        .filter(assignment => assignment.jobs && assignment.jobs.customers)
        .map(assignment => {
          const job = assignment.jobs;
          const customer = job.customers;
          const serviceLocation = customer.customer_service_locations?.[0];
          const coordinates = (serviceLocation && typeof serviceLocation === 'object') 
            ? ((serviceLocation as any)?.service_location_coordinates?.find?.((coord: any) => coord.is_primary) || 
               (serviceLocation as any)?.service_location_coordinates?.[0])
            : null;
          
          // Build address string
          const addressParts = [
            customer.service_street,
            customer.service_city,
            customer.service_state,
            customer.service_zip
          ].filter(Boolean);
          
          return {
            id: assignment.id,
            product_name: assignment.products?.name || 'Unknown Product',
            item_code: assignment.product_items?.item_code || `Bulk (${assignment.quantity})`,
            status: assignment.status,
            customer_name: customer.name,
            customer_address: addressParts.join(', '),
            latitude: coordinates?.latitude,
            longitude: coordinates?.longitude,
            job_type: job.job_type,
            scheduled_date: job.scheduled_date,
            customer_phone: customer.phone,
            quantity: assignment.quantity
          };
        })
        .filter(location => location.latitude && location.longitude);
    }
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !inventoryLocations?.length) return;

    mapboxgl.accessToken = mapboxToken;

    // Calculate bounds from all locations
    const bounds = new mapboxgl.LngLatBounds();
    inventoryLocations.forEach(location => {
      if (location.longitude && location.latitude) {
        bounds.extend([location.longitude, location.latitude]);
      }
    });

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      bounds: bounds.isEmpty() ? undefined : bounds,
      fitBoundsOptions: { padding: 50 }
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, inventoryLocations]);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current || !inventoryLocations?.length) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.inventory-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new markers
    inventoryLocations.forEach((location, index) => {
      if (!location.longitude || !location.latitude) return;

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'inventory-marker';
      markerElement.innerHTML = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full ${statusColors[location.status as keyof typeof statusColors]} text-white text-xs font-bold cursor-pointer shadow-lg border-2 border-white">
          ${location.quantity > 1 ? location.quantity : index + 1}
        </div>
      `;

      markerElement.addEventListener('click', () => {
        setSelectedLocation(location);
      });

      new mapboxgl.Marker(markerElement)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);
    });
  }, [inventoryLocations]);

  const handleNavigateToLocation = (location: InventoryLocation) => {
    if (location.latitude && location.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (showTokenInput) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mapbox Token Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              To display the inventory map, please enter your Mapbox public token.
            </p>
            <Input
              type="text"
              placeholder="Enter your Mapbox public token (pk.)"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <Button
              onClick={() => setShowTokenInput(false)}
              disabled={!mapboxToken || !mapboxToken.startsWith('pk.')}
              className="w-full"
            >
              Apply Token
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading inventory locations...</p>
        </div>
      </div>
    );
  }

  if (!inventoryLocations?.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No inventory locations found</p>
          <p className="text-sm text-gray-500">Equipment locations will appear here when items are assigned to jobs with addresses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 rounded-lg overflow-hidden bg-gray-100">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Radar Toggle */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4" />
          <span className="text-sm font-medium">Radar</span>
          <Switch checked={radarEnabled} onCheckedChange={setRadarEnabled} />
        </div>
      </div>

      {/* Equipment Status Legend - Horizontal at bottom */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h4 className="font-semibold text-sm">Equipment Status:</h4>
            <div className="flex items-center gap-4">
              {Object.entries(statusLabels).map(([status, label]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {inventoryLocations.length} locations
          </p>
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="absolute bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{selectedLocation.product_name}</h3>
                <Badge 
                  variant="secondary" 
                  className={`${statusColors[selectedLocation.status as keyof typeof statusColors]} text-white`}
                >
                  {statusLabels[selectedLocation.status as keyof typeof statusLabels]}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{selectedLocation.item_code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedLocation.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedLocation.scheduled_date).toLocaleDateString()}</span>
                </div>
                {selectedLocation.customer_address && (
                  <p className="text-xs">{selectedLocation.customer_address}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToLocation(selectedLocation)}
              >
                <Navigation className="h-4 w-4" />
              </Button>
              {selectedLocation.customer_phone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${selectedLocation.customer_phone}`, '_self')}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLocation(null)}
              >
                ×
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};