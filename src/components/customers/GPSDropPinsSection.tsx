
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
  RotateCcw,
  Satellite,
  Map as MapIcon,
  MoreVertical,
  Download,
  Copy,
  MoveVertical,
  Settings,
  ExternalLink,
  Navigation2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AddDropPinModal } from './AddDropPinModal';
import { EditDropPinModal } from './EditDropPinModal';
import { ManageCategoriesModal } from './ManageCategoriesModal';
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
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingCoordinate, setEditingCoordinate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  const [selectedCoordinate, setSelectedCoordinate] = useState<any>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'move' | null>(null);
  const [newCategoryForBulk, setNewCategoryForBulk] = useState<string>('');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { toast } = useToast();
  const { hasAdminAccess } = useUserRole();

  const { data: customer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

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

  const { data: categories = [] } = useQuery({
    queryKey: ['pin-categories', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pin_categories')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');
      
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

    // Click handler removed - GPS pins are only added through the Add Drop-Pin modal

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
      default: return 'mapbox://styles/mapbox/streets-v12';
    }
  };

  const getDefaultCenter = (): [number, number] => {
    // First try to use primary service location
    if (serviceLocations && serviceLocations.length > 0) {
      const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
      if (primaryLocation && primaryLocation.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
        const [lng, lat] = primaryLocation.gps_coordinates.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lng, lat];
        }
      }
    }
    
    // Fallback to coordinates average if available
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
        setMapStyle('satellite'); // Switch to satellite when clicking pins
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
    if (!category) return '#EF4444'; // Default red for uncategorized
    
    const categoryData = categories.find(cat => cat.name === category);
    return categoryData?.color || '#EF4444'; // Default red if category not found
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

  const openInMaps = (lat: number, lng: number, provider: 'google' | 'apple' | 'waze' | 'mapbox' = 'google') => {
    const urls = {
      google: `https://maps.google.com/?q=${lat},${lng}`,
      apple: `https://maps.apple.com/?q=${lat},${lng}`,
      waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
      mapbox: `https://api.mapbox.com/directions/v5/mapbox/driving/${lng},${lat}?access_token=${mapboxToken}`
    };
    
    if (provider === 'mapbox' && mapboxToken) {
      // Use Mapbox Directions API for internal navigation
      window.open(urls.mapbox, '_blank');
    } else {
      window.open(urls[provider], '_blank');
    }
  };

  const copyPointDetails = (coordinate: any) => {
    const serviceLocation = serviceLocations?.find(loc => loc.id === coordinate.service_location_id);
    const textData = `${customer?.name || 'Unknown'} - ${coordinate.point_name}\nCategory: ${coordinate.category || 'Uncategorized'}\nLocation: ${serviceLocation?.location_name || 'Unknown'}\nCoordinates: ${coordinate.latitude}, ${coordinate.longitude}\nDescription: ${coordinate.description || 'N/A'}\n`;

    navigator.clipboard.writeText(textData).then(() => {
      toast({
        title: "Success", 
        description: "Coordinate details copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy coordinate details",
        variant: "destructive",
      });
    });
  };

  // Bulk selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredCoordinates.map(coord => coord.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectCoordinate = (coordinateId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(coordinateId);
    } else {
      newSelected.delete(coordinateId);
    }
    setSelectedIds(newSelected);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('service_location_coordinates')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      refetch();
      setSelectedIds(new Set());
      toast({
        title: "Success",
        description: `${selectedIds.size} GPS drop-pins deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting coordinates:', error);
      toast({
        title: "Error",
        description: "Failed to delete GPS drop-pins",
        variant: "destructive",
      });
    }
  };

  const handleBulkMoveCategory = async (newCategory: string) => {
    try {
      const { error } = await supabase
        .from('service_location_coordinates')
        .update({ category: newCategory })
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      
      refetch();
      setSelectedIds(new Set());
      toast({
        title: "Success",
        description: `${selectedIds.size} GPS drop-pins moved to ${newCategory} category`,
      });
    } catch (error) {
      console.error('Error moving coordinates:', error);
      toast({
        title: "Error",
        description: "Failed to move GPS drop-pins",
        variant: "destructive",
      });
    }
  };

  const exportCoordinatesCSV = () => {
    const selectedCoords = filteredCoordinates.filter(coord => selectedIds.has(coord.id));
    const csvData = selectedCoords.map(coord => {
      const serviceLocation = serviceLocations?.find(loc => loc.id === coord.service_location_id);
      return {
        'Customer Name': customer?.name || 'Unknown',
        'Service Location': serviceLocation?.location_name || 'Unknown',
        'GPS Coordinate Name': coord.point_name,
        'Category': coord.category || 'Uncategorized',
        'Latitude': coord.latitude,
        'Longitude': coord.longitude,
        'Description': coord.description || '',
        'Created Date': new Date(coord.created_at).toLocaleDateString()
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gps-coordinates-${customer?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setSelectedIds(new Set());
    toast({
      title: "Success",
      description: `${selectedIds.size} coordinates exported to CSV`,
    });
  };

  const copyCoordinates = () => {
    const selectedCoords = filteredCoordinates.filter(coord => selectedIds.has(coord.id));
    const textData = selectedCoords.map(coord => {
      const serviceLocation = serviceLocations?.find(loc => loc.id === coord.service_location_id);
      return `${customer?.name || 'Unknown'} - ${coord.point_name}\nCategory: ${coord.category || 'Uncategorized'}\nLocation: ${serviceLocation?.location_name || 'Unknown'}\nCoordinates: ${coord.latitude}, ${coord.longitude}\nDescription: ${coord.description || 'N/A'}\n`;
    }).join('\n---\n');

    navigator.clipboard.writeText(textData).then(() => {
      setSelectedIds(new Set());
      toast({
        title: "Success",
        description: `${selectedIds.size} coordinates copied to clipboard`,
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy coordinates",
        variant: "destructive",
      });
    });
  };

  const filteredCoordinates = coordinates?.filter(coord => {
    const matchesSearch = coord.point_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coord.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || 
                           (selectedCategory === 'uncategorized' ? (!coord.category || coord.category === '') : coord.category === selectedCategory);
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
                variant="outline"
                size="sm"
                onClick={() => setIsManageCategoriesOpen(true)}
                className="touch-manipulation"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Categories
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
                  {/* Simplified Map Style Toggle */}
                  <div className="flex rounded-lg overflow-hidden border">
                    <Button
                      variant={mapStyle === 'satellite' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMapStyle('satellite')}
                      className="rounded-none px-2 lg:px-3 py-1 lg:py-2 text-xs"
                    >
                      <Satellite className="w-3 h-3 mr-1" />
                      Satellite
                    </Button>
                    <Button
                      variant={mapStyle === 'streets' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMapStyle('streets')}
                      className="rounded-none px-2 lg:px-3 py-1 lg:py-2 text-xs"
                    >
                      <MapIcon className="w-3 h-3 mr-1" />
                      Road
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
                  cursor: 'default',
                  minHeight: '300px',
                  touchAction: 'manipulation' // Optimize for mobile scrolling
                }}
              />
              
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Filter by Category</span>
                    </div>
                    <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
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
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Bulk Selection Header */}
              {hasAdminAccess && filteredCoordinates.length > 0 && (
                <div className="px-3 lg:px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.size === filteredCoordinates.length && filteredCoordinates.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm font-medium">
                      {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select All'}
                    </span>
                  </div>
                  
                  {selectedIds.size >= 2 && (
                    <div className="flex items-center gap-1">
                        <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="outline" size="sm" className="h-8 px-2">
                             <Trash2 className="w-3 h-3 mr-1" />
                             Delete
                           </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                           <AlertDialogHeader>
                             <AlertDialogTitle>Delete GPS Drop-Pins</AlertDialogTitle>
                             <AlertDialogDescription>
                               Are you sure you want to delete {selectedIds.size} GPS drop-pins? This action cannot be undone.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                             <AlertDialogAction 
                               onClick={handleBulkDelete}
                               className="bg-red-600 hover:bg-red-700"
                             >
                               Delete
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                      
                      <Select onValueChange={handleBulkMoveCategory}>
                        <SelectTrigger className="h-8 w-auto min-w-[120px]">
                          <SelectValue placeholder="Move to..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="access">Access</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                          <SelectItem value="parking">Parking</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button variant="outline" size="sm" onClick={exportCoordinatesCSV} className="h-8 px-2">
                        <Download className="w-3 h-3 mr-1" />
                        CSV
                      </Button>
                      
                      <Button variant="outline" size="sm" onClick={copyCoordinates} className="h-8 px-2">
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="max-h-[300px] lg:max-h-[350px] overflow-y-auto overscroll-contain">
                {filteredCoordinates.length > 0 ? (
                  <div className="space-y-1">
                    {filteredCoordinates.map((coordinate) => {
                      const serviceLocation = serviceLocations.find(loc => loc.id === coordinate.service_location_id);
                      const isSelected = selectedCoordinate?.id === coordinate.id;
                      
                      return (
                        <div 
                          key={coordinate.id} 
                          className={`p-3 lg:p-4 hover:bg-muted/50 active:bg-muted transition-colors border-l-4 touch-manipulation ${
                            isSelected ? 'bg-muted/50 border-l-blue-500' : 'border-l-transparent'
                          }`}
                          style={{ minHeight: '44px' }} // Minimum touch target size
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {hasAdminAccess && (
                                <Checkbox
                                  checked={selectedIds.has(coordinate.id)}
                                  onCheckedChange={(checked) => handleSelectCoordinate(coordinate.id, checked as boolean)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              )}
                              <div 
                                className="flex-1 min-w-0 cursor-pointer" 
                                onClick={() => setSelectedCoordinate(coordinate)}
                              >
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
                            </div>

                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                    className="touch-manipulation h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  {hasAdminAccess && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditCoordinate(coordinate);
                                      }}
                                    >
                                      <Edit className="w-3 h-3 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                  )}
                                  
                                   <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                       <DropdownMenuItem
                                         onSelect={(e) => e.preventDefault()}
                                       >
                                         <Navigation className="w-3 h-3 mr-2" />
                                         Navigate
                                         <ExternalLink className="w-3 h-3 ml-auto" />
                                       </DropdownMenuItem>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent side="right" align="start">
                                       <DropdownMenuItem
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           openInMaps(coordinate.latitude, coordinate.longitude, 'google');
                                         }}
                                       >
                                         Google Maps
                                       </DropdownMenuItem>
                                       <DropdownMenuItem
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           openInMaps(coordinate.latitude, coordinate.longitude, 'apple');
                                         }}
                                       >
                                         Apple Maps
                                       </DropdownMenuItem>
                                       <DropdownMenuItem
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           openInMaps(coordinate.latitude, coordinate.longitude, 'waze');
                                         }}
                                       >
                                         Waze
                                       </DropdownMenuItem>
                                       <DropdownMenuItem
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           openInMaps(coordinate.latitude, coordinate.longitude, 'mapbox');
                                         }}
                                       >
                                         <Navigation2 className="w-3 h-3 mr-2" />
                                         Internal Navigation
                                       </DropdownMenuItem>
                                     </DropdownMenuContent>
                                   </DropdownMenu>
                                   
                                   <DropdownMenuItem
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       copyPointDetails(coordinate);
                                     }}
                                   >
                                     <Copy className="w-3 h-3 mr-2" />
                                     Copy Point Details
                                   </DropdownMenuItem>
                                   
                                   <DropdownMenuSeparator />
                                  
                                  {hasAdminAccess && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          onClick={(e) => e.preventDefault()}
                                          className="text-red-600 focus:text-red-600"
                                        >
                                          <Trash2 className="w-3 h-3 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
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
                                </DropdownMenuContent>
                              </DropdownMenu>
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
        onClose={() => setIsAddModalOpen(false)}
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

      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        customerId={customerId}
        customerName={customer?.name || 'Unknown'}
        existingCategories={[]}
        onCategoriesUpdated={refetch}
      />
    </div>
  );
}
