import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCurrentInventoryLocations } from '@/hooks/useCurrentInventoryLocations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Satellite, Map as MapIcon, X, Package } from 'lucide-react';
import { MobileMapControls } from './MobileMapControls';
import { MapLegend } from './MapLegend';
import { MarkerDetailsSheet } from './MarkerDetailsSheet';

interface SimpleInventoryMapViewProps {
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
}

interface GroupedProduct {
  name: string;
  totalQuantity: number;
  trackedUnits: Array<{ code: string; quantity: number; deliveredDate: string }>;
  bulkQuantity: number;
  deliveredDate: string;
}

export const SimpleInventoryMapView: React.FC<SimpleInventoryMapViewProps> = ({
  searchQuery = '',
  selectedLocationId = 'all',
  selectedProductType = 'all'
}) => {
  console.log('🟢 SIMPLE MAP VIEW: Component rendering');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch current deployed inventory data
  const { data: inventoryLocations = [], isLoading: dataLoading, error: dataError } = useCurrentInventoryLocations({
    searchQuery,
    selectedLocationId,
    selectedProductType
  });

  console.log('📊 Inventory locations:', inventoryLocations);

  // Calculate status counts for legend
  const statusCounts = inventoryLocations.reduce((counts, location) => {
    counts[location.status] = (counts[location.status] || 0) + location.quantity;
    return counts;
  }, {} as Record<string, number>);

  const totalInventory = inventoryLocations.reduce((total, location) => total + location.quantity, 0);

  // Get Mapbox token
  useEffect(() => {
    const getToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          }
        });
        const data = await response.json();
        if (data.token) {
          setMapboxToken(data.token);
          console.log('🗺️ Mapbox token received');
        } else {
          const stored = localStorage.getItem('mapbox-token');
          if (stored) setMapboxToken(stored);
        }
      } catch (error) {
        console.error('🗺️ Token fetch error:', error);
        const stored = localStorage.getItem('mapbox-token');
        if (stored) setMapboxToken(stored);
      }
      setLoading(false);
    };
    getToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    console.log('🗺️ Initializing Mapbox map...');
    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/streets-v12',
      center: [-81.6944, 41.4993], // Cleveland, Ohio coordinates
      zoom: 9,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('load', () => {
      console.log('🗺️ Map loaded successfully!');
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setMapLoaded(false);
    };
  }, [mapboxToken]);

  // Update map style when changed
  useEffect(() => {
    if (map.current && mapboxToken) {
      const styleUrl = mapStyle === 'streets' 
        ? 'mapbox://styles/mapbox/streets-v12' 
        : 'mapbox://styles/mapbox/satellite-streets-v12';
      map.current.setStyle(styleUrl);
    }
  }, [mapStyle, mapboxToken]);

  // Create markers directly in component (proven approach)
  useEffect(() => {
    if (!map.current || !mapLoaded || !inventoryLocations.length) {
      console.log('📍 Markers: Waiting for map and data...', {
        hasMap: !!map.current,
        mapLoaded,
        locationsCount: inventoryLocations.length
      });
      return;
    }

    console.log('📍 Creating markers for', inventoryLocations.length, 'locations');

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const statusColors = {
      assigned: '#3b82f6',
      delivered: '#10b981', 
      in_service: '#f59e0b',
      maintenance: '#ef4444',
      available: '#6b7280'
    };

    // Calculate bounds for all locations
    const bounds = new mapboxgl.LngLatBounds();
    
    inventoryLocations.forEach((location, index) => {
      bounds.extend([location.longitude, location.latitude]);
      
      // Create marker element with STATIC approach (proven to work)
      const pinElement = document.createElement('div');
      pinElement.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: ${statusColors[location.status as keyof typeof statusColors] || statusColors.available};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        user-select: none;
      `;
      
      pinElement.textContent = location.quantity.toString();
      
      // Add click handler with stopPropagation (proven pattern)
      pinElement.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedLocation(location);
      });

      // Create and add marker with static properties
      const marker = new mapboxgl.Marker({
        element: pinElement,
        anchor: 'center',
        draggable: false,
        rotation: 0,
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to show all markers with padding
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { 
        padding: 80,
        maxZoom: 15
      });
    }

    console.log('📍 Created', markersRef.current.length, 'markers successfully');

  }, [map.current, mapLoaded, inventoryLocations]);

  // Helper function to get status colors
  const getStatusColor = (status: string) => {
    const colors = {
      assigned: '#3b82f6',
      delivered: '#10b981',
      in_service: '#f59e0b',
      maintenance: '#ef4444',
      available: '#6b7280'
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  // Helper function to group products by name and type
  const groupProductsByType = (items: any[]): GroupedProduct[] => {
    const grouped = items.reduce((acc, item) => {
      let productName = item.product_name;
      
      // Special handling: if product_name is just a number (like "3013"), it's likely a tracked unit
      // that should be grouped with the 250-Gallon Waste Tank
      if (/^\d{4}$/.test(productName.trim())) {
        productName = "250-Gallon Waste Tank";
      }
      
      // Clean up product name (remove tabs and extra spaces)
      productName = productName.replace(/\t/g, '').trim();
      
      if (!acc[productName]) {
        acc[productName] = {
          name: productName,
          totalQuantity: 0,
          trackedUnits: [],
          bulkQuantity: 0,
          deliveredDate: item.scheduled_date || item.delivery_date
        };
      }
      
      // If item code is a 4-digit number, it's a tracked unit
      if (/^\d{4}$/.test(item.item_code?.trim() || '')) {
        acc[productName].trackedUnits.push({
          code: item.item_code,
          quantity: item.quantity,
          deliveredDate: item.scheduled_date || item.delivery_date
        });
        acc[productName].totalQuantity += item.quantity;
      } else {
        // Otherwise it's bulk - add all the quantity to bulk
        acc[productName].bulkQuantity += item.quantity;
        acc[productName].totalQuantity += item.quantity;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped) as GroupedProduct[];
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!mapboxToken) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-4 h-[500px]">
          <div>Enter Mapbox Token:</div>
          <input 
            type="text" 
            placeholder="Mapbox token..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const token = (e.target as HTMLInputElement).value;
                localStorage.setItem('mapbox-token', token);
                setMapboxToken(token);
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </Card>
    );
  }

  // Map control handlers
  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleRecenter = () => {
    if (!inventoryLocations.length || !map.current) return;
    
    const bounds = new mapboxgl.LngLatBounds();
    inventoryLocations.forEach((location) => {
      bounds.extend([location.longitude, location.latitude]);
    });
    
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 15,
      });
    }
  };

  // Prepare status counts for legend
  const legendStatusCounts = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    color: getStatusColor(status),
  }));

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Mobile/Responsive Map Container */}
      <div className="relative w-full h-[280px] sm:h-[320px] md:h-[400px] lg:h-[500px] overflow-hidden rounded-xl">
        <div ref={mapContainer} className="w-full h-full" />
        
        {/* Map Style Controls - Top Left (wraps on mobile) */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
          <Button
            variant={mapStyle === 'streets' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setMapStyle('streets')}
            className={`h-9 md:h-10 px-3 shadow-md ${
              mapStyle === 'streets' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-white/90 backdrop-blur-sm hover:bg-white'
            }`}
          >
            <MapIcon className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Streets</span>
          </Button>
          <Button
            variant={mapStyle === 'satellite' ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setMapStyle('satellite')}
            className={`h-9 md:h-10 px-3 shadow-md ${
              mapStyle === 'satellite' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-white/90 backdrop-blur-sm hover:bg-white'
            }`}
          >
            <Satellite className="h-4 w-4 mr-1.5" />
            <span className="text-sm">Satellite</span>
          </Button>
        </div>

        {/* Mobile Map Controls - Bottom Right */}
        <div className="md:hidden">
          <MobileMapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocate={handleLocate}
            onRecenter={handleRecenter}
          />
        </div>
      
      {/* Loading overlay */}
      {dataLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
      )}
        
        {/* Desktop Info Panel (Right Side) - Hidden on Mobile */}
        {selectedLocation && (
          <div className="hidden md:block absolute top-4 right-4 z-10 w-96 max-h-[450px] overflow-y-auto">
            <Card className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Inventory at Location</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLocation(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {/* Location Info */}
                <div className="border-b pb-3">
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">Customer:</span> {selectedLocation.customer_name}
                    </div>
                    <div>
                      <span className="font-medium">Address:</span> {selectedLocation.customer_address}
                    </div>
                    {selectedLocation.customer_phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {selectedLocation.customer_phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inventory Summary */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Items:</span>
                    <span className="text-lg font-bold">{selectedLocation.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground"><span className="font-bold">Product Types:</span></span>
                    <span className="text-sm font-bold">{selectedLocation.items ? groupProductsByType(selectedLocation.items).length : 1}</span>
                  </div>
                </div>


                {/* Grouped Product Summary */}
                <div>
                  <h4 className="font-medium mb-2">Equipment at this location:</h4>
                  <div className="space-y-2">
                    {selectedLocation.items && selectedLocation.items.length > 0 ? (
                      groupProductsByType(selectedLocation.items).map((product, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-background">
                          <div className="mb-2">
                            <h5 className="font-semibold text-base">{product.name}</h5>
                          </div>
                          <div className="mb-3">
                            <span className="text-sm font-medium">
                              Total Units at Location: {product.totalQuantity}
                            </span>
                          </div>
                          {product.bulkQuantity > 0 && (
                            <div className="text-sm mb-2">
                              <div className="font-medium">{product.bulkQuantity} Bulk Inventory</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Delivered on: {new Date(product.deliveredDate).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                          {product.trackedUnits.length > 0 && (
                            <div className="text-sm">
                              <div className="font-medium mb-1">
                                {product.trackedUnits.length} Tracked Unit{product.trackedUnits.length > 1 ? 's' : ''}:
                              </div>
                              <div className="space-y-1 pl-2">
                                {product.trackedUnits.map((unit, unitIndex) => (
                                  <div key={unitIndex} className="text-xs text-muted-foreground">
                                    {unit.code} - Delivered on: {new Date(unit.deliveredDate).toLocaleDateString()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="border rounded-lg p-3 bg-background">
                        <div className="mb-2">
                          <span className="font-medium text-sm">
                            {selectedLocation.quantity} {selectedLocation.product_name}
                            {selectedLocation.quantity > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Loading overlay */}
        {dataLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading inventory data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet for Marker Details */}
      <MarkerDetailsSheet
        open={!!selectedLocation}
        onOpenChange={(open) => !open && setSelectedLocation(null)}
        location={selectedLocation}
      />

      {/* Legend Below Map - Wraps on Mobile */}
      <MapLegend
        statusCounts={legendStatusCounts}
        totalInventory={totalInventory}
      />
    </div>
  );
};