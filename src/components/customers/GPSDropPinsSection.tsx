
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  Plus, 
  Search, 
  MapPin, 
  Navigation, 
  Edit, 
  Trash2,
  Filter,
  Layers,
  Crosshair,
  RotateCcw,
  Satellite,
  Map as MapIcon,
  Mountain
} from 'lucide-react';
import { AddDropPinModal } from './AddDropPinModal';
import { EditDropPinModal } from './EditDropPinModal';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface GPSDropPinsSectionProps {
  customerId: string;
}

export function GPSDropPinsSection({ customerId }: GPSDropPinsSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCoordinate, setEditingCoordinate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [selectedCoordinate, setSelectedCoordinate] = useState<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [clickToAdd, setClickToAdd] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { toast } = useToast();
  const { hasAdminAccess } = useUserRole();

  const { data: serviceLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ['customer-service-locations', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', customerId);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: coordinates, isLoading: coordinatesLoading, refetch } = useQuery({
    queryKey: ['service-location-coordinates', customerId],
    queryFn: async () => {
      if (!serviceLocations || serviceLocations.length === 0) return [];
      
      const locationIds = serviceLocations.map(loc => loc.id);
      const { data, error } = await supabase
        .from('service_location_coordinates')
        .select('*')
        .in('service_location_id', locationIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!serviceLocations && serviceLocations.length > 0,
  });

  const { data: categories } = useQuery({
    queryKey: ['coordinate-categories', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_customer_categories', { customer_uuid: customerId });
      
      if (error) throw error;
      return data;
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
      }
    };

    getMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(mapStyle),
      center: getDefaultCenter(),
      zoom: 12
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    // Add click handler for click-to-add mode (only for admin users)
    map.current.on('click', (e) => {
      if (clickToAdd && hasAdminAccess) {
        const { lng, lat } = e.lngLat;
        // Open add modal with coordinates pre-filled
        setIsAddModalOpen(true);
        setClickToAdd(false);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Update map style
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(getMapStyle(mapStyle));
    }
  }, [mapStyle]);

  // Update map markers when coordinates change
  useEffect(() => {
    if (map.current && coordinates) {
      updateMapMarkers();
    }
  }, [coordinates]);

  const getMapStyle = (style: string) => {
    switch (style) {
      case 'satellite': return 'mapbox://styles/mapbox/satellite-v9';
      case 'terrain': return 'mapbox://styles/mapbox/outdoors-v12';
      default: return 'mapbox://styles/mapbox/streets-v12';
    }
  };

  const getDefaultCenter = (): [number, number] => {
    if (coordinates && coordinates.length > 0) {
      const avgLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
      const avgLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;
      return [avgLng, avgLat];
    }
    return [-79.9959, 40.4406]; // Default to Pittsburgh
  };

  const updateMapMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    if (!coordinates) return;

    // Add markers for each coordinate with mobile-optimized clustering
    const clusterThreshold = window.innerWidth < 768 ? 5 : 10; // Fewer markers before clustering on mobile
    
    coordinates.forEach(coord => {
      const color = getCategoryColor(coord.category);
      
      // Create custom marker element for better touch targets on mobile
      const markerEl = document.createElement('div');
      markerEl.className = 'custom-marker';
      markerEl.style.cssText = `
        width: ${window.innerWidth < 768 ? '32px' : '24px'};
        height: ${window.innerWidth < 768 ? '32px' : '24px'};
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
      `;
      
      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([coord.longitude, coord.latitude])
        .setPopup(new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false 
        }).setHTML(`
          <div class="p-3 min-w-[200px]">
            <h4 class="font-semibold text-sm mb-1">${coord.point_name}</h4>
            ${coord.description ? `<p class="text-xs text-gray-600 mb-2">${coord.description}</p>` : ''}
            <p class="text-xs text-gray-500 font-mono mb-2">${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}</p>
            ${coord.category ? `<span class="inline-block px-2 py-1 text-xs bg-gray-100 rounded">${coord.category}</span>` : ''}
            ${hasAdminAccess ? `
              <div class="flex gap-1 mt-2">
                <button class="edit-btn px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600" data-id="${coord.id}">Edit</button>
                <button class="navigate-btn px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600" data-lat="${coord.latitude}" data-lng="${coord.longitude}">Navigate</button>
              </div>
            ` : ''}
          </div>
        `))
        .addTo(map.current);

      // Enhanced mobile touch interactions
      markerEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        markerEl.style.transform = 'scale(1.1)';
      });
      
      markerEl.addEventListener('touchend', (e) => {
        e.preventDefault();
        markerEl.style.transform = 'scale(1)';
        setSelectedCoordinate(coord);
      });

      markerEl.addEventListener('click', () => {
        setSelectedCoordinate(coord);
      });

      markers.current.push(marker);
    });

    // Fit map to show all markers with mobile-optimized padding
    if (coordinates.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => {
        bounds.extend([coord.longitude, coord.latitude]);
      });
      const padding = window.innerWidth < 768 ? 20 : 50;
      map.current.fitBounds(bounds, { padding });
    }

    // Add popup event listeners for admin actions
    if (hasAdminAccess) {
      setTimeout(() => {
        document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const coordId = (e.target as HTMLElement).dataset.id;
            const coord = coordinates.find(c => c.id === coordId);
            if (coord) handleEditCoordinate(coord);
          });
        });
        
        document.querySelectorAll('.navigate-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const lat = parseFloat((e.target as HTMLElement).dataset.lat || '0');
            const lng = parseFloat((e.target as HTMLElement).dataset.lng || '0');
            openInMaps(lat, lng);
          });
        });
      }, 100);
    }
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      'units': '#3B82F6',
      'access': '#10B981',
      'delivery': '#F59E0B',
      'parking': '#8B5CF6',
      'utilities': '#EF4444',
      'other': '#6B7280',
    };
    return colors[category || 'other'] || colors.other;
  };

  const recenterMap = () => {
    if (map.current) {
      const center = getDefaultCenter();
      map.current.flyTo({ center, zoom: 12 });
    }
  };

  const handleDropPinAdded = () => {
    refetch();
    setIsAddModalOpen(false);
    setClickToAdd(false);
    toast({
      title: "Success",
      description: "GPS drop-pin added successfully",
    });
  };

  const handleDropPinUpdated = () => {
    refetch();
    setIsEditModalOpen(false);
    setEditingCoordinate(null);
    toast({
      title: "Success",
      description: "GPS drop-pin updated successfully",
    });
  };

  const handleEditCoordinate = (coordinate: any) => {
    setEditingCoordinate(coordinate);
    setIsEditModalOpen(true);
  };

  const handleDeleteCoordinate = async (coordinateId: string) => {
    try {
      const { error } = await supabase
        .from('service_location_coordinates')
        .delete()
        .eq('id', coordinateId);

      if (error) throw error;
      
      refetch();
      toast({
        title: "Success",
        description: "GPS drop-pin deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting coordinate:', error);
      toast({
        title: "Error",
        description: "Failed to delete GPS drop-pin",
        variant: "destructive",
      });
    }
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };

  const filteredCoordinates = coordinates?.filter(coord => {
    const matchesSearch = coord.point_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coord.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || coord.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categoryColors: Record<string, string> = {
    'units': 'bg-blue-100 text-blue-800 border-blue-200',
    'access': 'bg-green-100 text-green-800 border-green-200',
    'delivery': 'bg-orange-100 text-orange-800 border-orange-200',
    'parking': 'bg-purple-100 text-purple-800 border-purple-200',
    'utilities': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'other': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  if (locationsLoading || coordinatesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted animate-pulse rounded-lg h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">GPS Coordinates</h3>
          <p className="text-sm text-muted-foreground">
            Interactive map and coordinate management for service locations
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasAdminAccess && (
            <>
              <Button
                variant={clickToAdd ? "default" : "outline"}
                size="sm"
                onClick={() => setClickToAdd(!clickToAdd)}
                disabled={!serviceLocations || serviceLocations.length === 0}
                className="touch-manipulation" // Better mobile touch targets
              >
                <Crosshair className="w-4 h-4 mr-2" />
                {clickToAdd ? 'Click Mode ON' : 'Click to Add'}
              </Button>
              
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white touch-manipulation"
                disabled={!serviceLocations || serviceLocations.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Drop-Pin
              </Button>
            </>
          )}
          
          {!hasAdminAccess && (
            <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
              View-only mode
            </div>
          )}
        </div>
      </div>

      {!serviceLocations || serviceLocations.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No service locations</h3>
          <p className="text-muted-foreground">
            You need to create a service location first before adding GPS drop-pins
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Map Panel - Mobile First Design */}
          <Card className="overflow-hidden order-1 xl:order-1">
            <CardHeader className="pb-2 px-3 lg:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm lg:text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Interactive Map
                </CardTitle>
                
                <div className="flex items-center gap-1 lg:gap-2">
                  {/* Mobile-Optimized Map Style Selector */}
                  <div className="flex rounded-lg overflow-hidden border">
                    <Button
                      variant={mapStyle === 'streets' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMapStyle('streets')}
                      className="rounded-none p-1 lg:p-2"
                    >
                      <MapIcon className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={mapStyle === 'satellite' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMapStyle('satellite')}
                      className="rounded-none p-1 lg:p-2"
                    >
                      <Satellite className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={mapStyle === 'terrain' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMapStyle('terrain')}
                      className="rounded-none p-1 lg:p-2"
                    >
                      <Mountain className="w-3 h-3" />
                    </Button>
                  </div>

                  <Button variant="outline" size="sm" onClick={recenterMap} className="p-1 lg:p-2">
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 relative">
              <div 
                ref={mapContainer} 
                className="h-[300px] lg:h-[400px] w-full touch-manipulation"
                style={{ 
                  cursor: clickToAdd ? 'crosshair' : 'default',
                  minHeight: '300px',
                  touchAction: 'manipulation' // Optimize for mobile scrolling
                }}
              />
              
              {clickToAdd && hasAdminAccess && (
                <div className="absolute inset-x-0 bottom-4 mx-4 z-10">
                  <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Crosshair className="w-4 h-4" />
                    <span className="hidden sm:inline">Click anywhere on the map to add a new drop-pin</span>
                    <span className="sm:hidden">Tap to add drop-pin</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coordinates List Panel - Mobile Optimized */}
          <Card className="order-2 xl:order-2">
            <CardHeader className="pb-2 px-3 lg:px-6">
              <CardTitle className="text-sm lg:text-base flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                GPS Coordinates ({filteredCoordinates.length})
              </CardTitle>
              
              {/* Mobile-Optimized Search and Filter Controls */}
              <div className="space-y-2 lg:space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search drop-pins..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9 touch-manipulation text-base" // Larger text for mobile
                  />
                </div>
                
                {categories && categories.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                      className="touch-manipulation text-xs lg:text-sm h-8"
                    >
                      All
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.category_name}
                        variant={selectedCategory === cat.category_name ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.category_name)}
                        className="touch-manipulation text-xs lg:text-sm h-8"
                      >
                        {cat.category_name} ({cat.point_count})
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="max-h-[300px] lg:max-h-[350px] overflow-y-auto overscroll-contain">
                {filteredCoordinates.length > 0 ? (
                  <div className="space-y-1">
                    {filteredCoordinates.map((coordinate) => {
                      const serviceLocation = serviceLocations.find(loc => loc.id === coordinate.service_location_id);
                      const isSelected = selectedCoordinate?.id === coordinate.id;
                      
                      return (
                        <div 
                          key={coordinate.id} 
                          className={`p-3 lg:p-4 hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer border-l-4 touch-manipulation ${
                            isSelected ? 'bg-muted/50 border-l-blue-500' : 'border-l-transparent'
                          }`}
                          onClick={() => setSelectedCoordinate(coordinate)}
                          style={{ minHeight: '44px' }} // Minimum touch target size
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm text-foreground truncate">
                                  {coordinate.point_name}
                                </h4>
                                {coordinate.category && (
                                  <Badge 
                                    className={`text-xs ${categoryColors[coordinate.category] || categoryColors.other}`}
                                  >
                                    {coordinate.category}
                                  </Badge>
                                )}
                                {coordinate.is_primary && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>

                              {coordinate.description && (
                                <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                                  {coordinate.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-mono">
                                  {coordinate.latitude.toFixed(4)}, {coordinate.longitude.toFixed(4)}
                                </span>
                                {serviceLocation && (
                                  <span className="truncate">
                                    {serviceLocation.location_name}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-1 ml-2">
                              {hasAdminAccess && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditCoordinate(coordinate);
                                    }}
                                    className="touch-manipulation h-8 w-8 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInMaps(coordinate.latitude, coordinate.longitude);
                                }}
                                className="touch-manipulation h-8 w-8 p-0"
                              >
                                <Navigation className="w-3 h-3" />
                              </Button>
                              
                              {hasAdminAccess && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                      className="touch-manipulation h-8 w-8 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete GPS Drop-Pin</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{coordinate.point_name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteCoordinate(coordinate.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Navigation className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="text-sm font-medium text-foreground mb-1">No GPS drop-pins</h4>
                    <p className="text-xs text-muted-foreground">
                      Add your first GPS drop-pin to get started
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <AddDropPinModal
        customerId={customerId}
        serviceLocations={serviceLocations || []}
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setClickToAdd(false);
        }}
        onSuccess={handleDropPinAdded}
      />

      {editingCoordinate && (
        <EditDropPinModal
          customerId={customerId}
          serviceLocations={serviceLocations || []}
          coordinate={editingCoordinate}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCoordinate(null);
          }}
          onSuccess={handleDropPinUpdated}
        />
      )}
    </div>
  );
}
