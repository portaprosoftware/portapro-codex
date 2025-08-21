import React, { useState, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCurrentInventoryLocations } from '@/hooks/useCurrentInventoryLocations';
import { useInventoryMapboxInitializer } from '@/hooks/useInventoryMapboxInitializer';
import { useInventoryMarkerManager, InventoryLocation } from '@/hooks/useInventoryMarkerManager';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Satellite, Map as MapIcon, X, Package } from 'lucide-react';
import { toast } from 'sonner';

interface SimpleInventoryMapViewProps {
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
}

export const SimpleInventoryMapView: React.FC<SimpleInventoryMapViewProps> = ({
  searchQuery,
  selectedLocationId,
  selectedProductType
}) => {
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocation | null>(null);
  
  const { map, mapContainer, isLoading, error } = useInventoryMapboxInitializer();
  
  const { 
    data: inventoryLocations = [], 
    isLoading: isLoadingData,
    error: dataError 
  } = useCurrentInventoryLocations({
    searchQuery,
    selectedLocationId,
    selectedProductType
  });

  console.log('🟢 SIMPLE MAP VIEW: Component rendering');
  console.log('📊 Inventory locations:', inventoryLocations);

  // Use the marker manager hook
  useInventoryMarkerManager({
    map,
    locations: inventoryLocations,
    onLocationSelect: setSelectedLocation
  });

  // Calculate status counts for legend
  const statusCounts = inventoryLocations.reduce((counts, location) => {
    counts[location.status] = (counts[location.status] || 0) + location.quantity;
    return counts;
  }, {} as Record<string, number>);

  const totalInventory = inventoryLocations.reduce((total, location) => total + location.quantity, 0);

  // Update map style when changed
  useEffect(() => {
    if (map && mapStyle) {
      const styleUrl = mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-v9'
        : 'mapbox://styles/mapbox/streets-v12';
      
      map.setStyle(styleUrl);
    }
  }, [map, mapStyle]);

  // Helper function to get status colors (matching useInventoryMarkerManager)
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

  // Handle errors
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Map Error</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
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

  return (
    <div className="relative w-full h-[500px]">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Legend - Top Left */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-4 w-4" />
            <span className="text-sm font-medium">Current Deployed Inventory</span>
          </div>
          <div className="text-lg font-bold">{totalInventory} Units</div>
          
          <div className="mt-3 space-y-1">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center space-x-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: getStatusColor(status) }}
                />
                <span className="capitalize">{status}: {count}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Map Style Controls */}
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border shadow-lg p-2">
          <div className="flex space-x-1">
            <Button
              variant={mapStyle === 'streets' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapStyle('streets')}
              className="flex items-center space-x-1"
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Streets</span>
            </Button>
            <Button
              variant={mapStyle === 'satellite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMapStyle('satellite')}
              className="flex items-center space-x-1"
            >
              <Satellite className="h-4 w-4" />
              <span className="hidden sm:inline">Satellite</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Loading overlay */}
      {isLoadingData && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
      )}

      {/* Popup for selected location */}
      {selectedLocation && (
        <div className="absolute top-4 right-4 z-10 w-80">
          <Card className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{selectedLocation.product_name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLocation(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Customer:</span> {selectedLocation.customer_name}
              </div>
              <div>
                <span className="font-medium">Address:</span> {selectedLocation.customer_address}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className="px-2 py-1 rounded-full text-xs font-medium" 
                      style={{
                        backgroundColor: getStatusColor(selectedLocation.status) + '20',
                        color: getStatusColor(selectedLocation.status)
                      }}>
                  {selectedLocation.status}
                </span>
              </div>
              <div>
                <span className="font-medium">Quantity:</span> {selectedLocation.quantity}
              </div>
              <div>
                <span className="font-medium">Job Type:</span> {selectedLocation.job_type}
              </div>
              <div>
                <span className="font-medium">Scheduled:</span> {selectedLocation.scheduled_date}
              </div>
              {selectedLocation.customer_phone && (
                <div>
                  <span className="font-medium">Phone:</span> {selectedLocation.customer_phone}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};