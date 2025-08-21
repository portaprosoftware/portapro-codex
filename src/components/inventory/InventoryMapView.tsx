import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { MapPin, Navigation, Phone, Package, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, subtractDays } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { useInventoryMapboxInitializer } from '@/hooks/useInventoryMapboxInitializer';
import { useInventoryMarkerManager, InventoryLocation } from '@/hooks/useInventoryMarkerManager';
import { useInventoryWithDateRange } from '@/hooks/useInventoryWithDateRange';
import 'mapbox-gl/dist/mapbox-gl.css';

interface InventoryMapViewProps {
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
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

export const InventoryMapView: React.FC<InventoryMapViewProps> = ({
  searchQuery,
  selectedLocationId,
  selectedProductType
}) => {
  console.log('🗺️ InventoryMapView: Component rendering with props:', {
    searchQuery,
    selectedLocationId,
    selectedProductType
  });
  // Date state following proven pattern
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocation | null>(null);

  // Initialize mapbox following proven pattern
  const { map, mapContainer, isLoading: mapLoading, error, mapboxToken, showTokenInput } = useInventoryMapboxInitializer();
  
  console.log('🗺️ InventoryMapView: Mapbox state:', {
    hasMap: !!map,
    mapLoading,
    error,
    hasToken: !!mapboxToken,
    showTokenInput
  });

  // Fetch inventory data with date filtering
  const { data: inventoryLocations, isLoading, error: dataError } = useInventoryWithDateRange({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    searchQuery,
    selectedLocationId,
    selectedProductType
  });

  console.log('🗺️ InventoryMapView: Data state:', {
    locationsCount: inventoryLocations?.length || 0,
    isLoading,
    dataError,
    sampleLocations: inventoryLocations?.slice(0, 2)
  });

  // Use marker manager following proven pattern
  useInventoryMarkerManager({
    map,
    locations: inventoryLocations || [],
    onLocationSelect: setSelectedLocation
  });

  // Date navigation functions following proven pattern
  const handleDatePrevious = () => {
    setSelectedDate(subtractDays(selectedDate, 1));
    setDateRange(prev => prev ? {
      ...prev,
      from: subtractDays(prev.from!, 1),
      to: subtractDays(prev.to!, 1)
    } : undefined);
  };

  const handleDateNext = () => {
    setSelectedDate(addDays(selectedDate, 1));
    setDateRange(prev => prev ? {
      ...prev,
      from: addDays(prev.from!, 1),
      to: addDays(prev.to!, 1)
    } : undefined);
  };

  const handleQuickSelect = (type: 'today' | 'tomorrow' | 'week') => {
    const today = new Date();
    switch (type) {
      case 'today':
        setSelectedDate(today);
        setDateRange({ from: today, to: today });
        break;
      case 'tomorrow':
        const tomorrow = addDays(today, 1);
        setSelectedDate(tomorrow);
        setDateRange({ from: tomorrow, to: tomorrow });
        break;
      case 'week':
        setSelectedDate(today);
        setDateRange({ from: today, to: addDays(today, 7) });
        break;
    }
  };

  const handleNavigateToLocation = (location: InventoryLocation) => {
    if (location.latitude && location.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (showTokenInput) {
    console.log('🗺️ InventoryMapView: Showing token input screen');
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Mapbox Token Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              To display the inventory map, please configure your Mapbox public token in Supabase Edge Function Secrets.
            </p>
            <p className="text-xs mt-2 text-gray-400">Debug: showTokenInput = true</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    console.log('🗺️ InventoryMapView: Showing error screen:', error);
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Map Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{error}</p>
            <p className="text-xs mt-2 text-gray-400">Check console for details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dataError) {
    console.log('🗺️ InventoryMapView: Showing data error screen:', dataError);
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Data Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Failed to load inventory data: {dataError.message}</p>
            <p className="text-xs mt-2 text-gray-400">Check console for details</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || mapLoading) {
    console.log('🗺️ InventoryMapView: Showing loading screen', { isLoading, mapLoading });
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading inventory locations...</p>
          <p className="text-xs mt-1 text-gray-400">
            Map: {mapLoading ? 'Loading...' : 'Ready'} | Data: {isLoading ? 'Loading...' : 'Ready'}
          </p>
        </div>
      </div>
    );
  }

  if (!inventoryLocations?.length) {
    console.log('🗺️ InventoryMapView: Showing no data screen', {
      hasInventoryLocations: !!inventoryLocations,
      inventoryLocationsLength: inventoryLocations?.length,
      hasMap: !!map,
      mapLoading,
      isLoading,
      dateRange
    });
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No inventory locations found</p>
          <p className="text-sm text-gray-500">Equipment locations will appear here when items are assigned to jobs with addresses</p>
          <p className="text-xs text-gray-400 mt-2">
            To see locations on the map: Create jobs → Assign products to jobs → Add customer addresses with GPS coordinates
          </p>
          <p className="text-xs mt-2 text-gray-400">
            Debug: Map={!!map ? 'Ready' : 'Not Ready'}, Data={inventoryLocations?.length || 0} locations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Navigation and Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDatePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm font-medium">
            {format(selectedDate, 'PPP')}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect('today')}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect('tomorrow')}
          >
            Tomorrow
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect('week')}
          >
            Next 7 Days
          </Button>
        </div>

        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
          placeholder="Select date range"
          className="w-auto"
        />
      </div>

      {/* Map Container */}
      <div className="relative h-96 rounded-lg overflow-hidden bg-gray-100">
        <div ref={mapContainer} className="absolute inset-0" />

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
    </div>
  );
};