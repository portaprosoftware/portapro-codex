
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
  Navigation2,
  Maximize2
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
import { ExpandedMapModal } from './ExpandedMapModal';
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
  const [isExpandedMapOpen, setIsExpandedMapOpen] = useState(false);
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
      if (!customerId) throw new Error('Customer ID is required');
      
      const { data, error } = await supabase
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const { data: serviceLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ['customer-service-locations', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      
      const { data, error } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
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
      if (!customerId) throw new Error('Customer ID is required');
      
      const { data, error } = await supabase
        .from('pin_categories')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  // Fetch Mapbox token
  useEffect(() => {
    const getMapboxToken = async () => {
      try {
        console.log('GPS Section: Attempting to fetch Mapbox token...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('GPS Section: Supabase function error:', error);
          throw error;
        }
        
        if (!data?.token) {
          console.error('GPS Section: No token received from Mapbox service', data);
          throw new Error('No token received from Mapbox service');
        }
        
        console.log('GPS Section: Mapbox token received successfully');
        console.log('GPS Section: Token length:', data.token.length);
        console.log('GPS Section: Token preview:', data.token.substring(0, 50) + '...');
        
        // Validate token format
        if (!data.token.startsWith('pk.')) {
          console.error('GPS Section: Invalid token format - should start with pk.', data.token.substring(0, 20));
          throw new Error('Invalid Mapbox token format');
        }
        
        setMapboxToken(data.token);
        
      } catch (error) {
        console.error('GPS Section: Error fetching Mapbox token:', error);
        toast({
          title: "Map Configuration Error",
          description: "Unable to load map. Please check Mapbox token configuration.",
          variant: "destructive",
        });
      }
    };

    getMapboxToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    const initializeMap = async () => {
      mapboxgl.accessToken = mapboxToken;

      const center = await getDefaultCenter();

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: getMapStyle(mapStyle),
        center: center,
        zoom: 18 // Higher zoom for better detail view
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right');

      // Enhanced bounds fitting with validation
      const handleBoundsFitting = () => {
        if (!map.current || !coordinates || coordinates.length === 0) return;
        
        // Validate all coordinates before using them
        const validCoords = coordinates.filter(coord => 
          coord && 
          typeof coord.latitude === 'number' && 
          typeof coord.longitude === 'number' && 
          !isNaN(coord.latitude) && 
          !isNaN(coord.longitude) &&
          coord.latitude >= -90 && coord.latitude <= 90 &&
          coord.longitude >= -180 && coord.longitude <= 180
        );
        
        if (validCoords.length === 0) return;
        
        try {
          if (validCoords.length === 1) {
            // Single pin - zoom to it with high zoom level
            const coord = validCoords[0];
            map.current.flyTo({
              center: [coord.longitude, coord.latitude],
              zoom: 18,
              duration: 1000
            });
          } else {
            // Multiple pins - fit all pins in view
            const bounds = new mapboxgl.LngLatBounds();
            
            validCoords.forEach(coord => {
              bounds.extend([coord.longitude, coord.latitude]);
            });
            
            // Enhanced padding for mobile vs desktop
            const isMobile = window.innerWidth < 768;
            const padding = isMobile 
              ? { top: 80, bottom: 80, left: 20, right: 20 }
              : { top: 100, bottom: 100, left: 100, right: 100 };
              
            map.current.fitBounds(bounds, { 
              padding, 
              maxZoom: 16,
              duration: 1000
            });
          }
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      };

      // Handle bounds fitting after map is loaded
      map.current.on('load', () => {
        // Add service location marker first
        addServiceLocationMarker();
        // Then handle bounds for drop pins
        handleBoundsFitting();
      });
      
      // Also handle immediate fitting if data is already available
      setTimeout(() => {
        addServiceLocationMarker();
        handleBoundsFitting();
      }, 500);
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken, serviceLocations, coordinates]);

  // Update map style
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(getMapStyle(mapStyle));
    }
  }, [mapStyle]);

  // Update map markers when coordinates change
  useEffect(() => {
    console.log('Coordinates updated:', coordinates);
    console.log('Service locations:', serviceLocations);
    console.log('Map current:', !!map.current);
    
    if (map.current && coordinates !== undefined && serviceLocations !== undefined) {
      // Wait a bit for map to fully initialize
      setTimeout(() => {
        updateMapMarkers();
        // Fix any Kansas placeholder pins when coordinates load
        fixKansasPlaceholderPins();
      }, 100);
    }
  }, [coordinates, serviceLocations]);

  // Function to fix existing placeholder pins with Kansas coordinates
  const fixKansasPlaceholderPins = async () => {
    if (!coordinates || !serviceLocations) return;
    
    // Check if there are any Kansas placeholder pins
    const kansasPins = coordinates.filter(coord => 
      coord.latitude === 39.8283 && coord.longitude === -98.5795
    );
    
    if (kansasPins.length === 0) return;
    
    // Get target coordinates for the customer
    const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
    let targetCoordinates: [number, number] | null = null;

    // Check if we already have GPS coordinates stored
    if (primaryLocation?.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
      // Handle both formats: "(-81.83824,41.36749)" and "-81.83824,41.36749"
      const coordStr = primaryLocation.gps_coordinates.replace(/[()]/g, '');
      const [lng, lat] = coordStr.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        targetCoordinates = [lng, lat];
      }
    }

    // If no stored coordinates, try to geocode the address
    if (!targetCoordinates && primaryLocation?.street && primaryLocation?.city && primaryLocation?.state) {
      const fullAddress = [
        primaryLocation.street,
        primaryLocation.street2,
        primaryLocation.city,
        primaryLocation.state,
        primaryLocation.zip
      ].filter(Boolean).join(' ');

      try {
        const geocoded = await geocodeAddress(fullAddress);
        if (geocoded) {
          targetCoordinates = geocoded;
          
          // Store the geocoded coordinates for future use
          await supabase
            .from('customer_service_locations')
            .update({ 
              gps_coordinates: `${geocoded[0]},${geocoded[1]}` 
            })
            .eq('id', primaryLocation.id);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    }

    // If we have target coordinates, update the Kansas pins
    if (targetCoordinates) {
      const [targetLng, targetLat] = targetCoordinates;
      
      const updatePromises = kansasPins.map(pin => 
        supabase
          .from('service_location_coordinates')
          .update({
            latitude: targetLat,
            longitude: targetLng,
            description: 'Pin location updated to customer address'
          })
          .eq('id', pin.id)
      );

      await Promise.all(updatePromises);
      
      // Refetch coordinates to show the updated locations
      refetch();
      
      toast({
        title: "Location Updated",
        description: `${kansasPins.length} placeholder pins moved to customer location`,
      });
    }
  };

  const getMapStyle = (style: string) => {
    switch (style) {
      case 'satellite': return 'mapbox://styles/mapbox/satellite-v9';
      default: return 'mapbox://styles/mapbox/streets-v12';
    }
  };

  // Geocoding function to convert address to coordinates
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    if (!mapboxToken || !address.trim()) return null;
    
    try {
      const encodedAddress = encodeURIComponent(address.trim());
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1&country=us`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
          return [lng, lat];
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return null;
  };

  const getDefaultCenter = async (): Promise<[number, number]> => {
    // Default fallback coordinates (Pittsburgh)
    const fallbackCoords: [number, number] = [-79.9959, 40.4406];
    
    try {
      // First try to use primary service location with stored GPS coordinates
      if (serviceLocations && serviceLocations.length > 0) {
        const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
        
        // Check if we already have GPS coordinates stored
        if (primaryLocation && primaryLocation.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
          // Handle both formats: "(-81.83824,41.36749)" and "-81.83824,41.36749"
          const coordStr = primaryLocation.gps_coordinates.replace(/[()]/g, '');
          const coords = coordStr.split(',').map(Number);
          if (coords.length === 2 && !isNaN(coords[1]) && !isNaN(coords[0])) {
            return [coords[0], coords[1]]; // [longitude, latitude] for Mapbox
          }
        }
        
        // If no GPS coordinates, try to geocode the address
        if (primaryLocation && primaryLocation.street && primaryLocation.city && primaryLocation.state) {
          const fullAddress = [
            primaryLocation.street,
            primaryLocation.street2,
            primaryLocation.city,
            primaryLocation.state,
            primaryLocation.zip
          ].filter(Boolean).join(' ');
          
          const geocoded = await geocodeAddress(fullAddress);
          if (geocoded) {
            // Store the geocoded coordinates for future use
            try {
              await supabase
                .from('customer_service_locations')
                .update({ 
                  gps_coordinates: `${geocoded[0]},${geocoded[1]}` 
                })
                .eq('id', primaryLocation.id);
              
              return geocoded;
            } catch (error) {
              console.error('Error storing geocoded coordinates:', error);
              return geocoded; // Still return the geocoded coords even if storage fails
            }
          }
        }
      }
      
      // Fallback to coordinates average if available
      if (coordinates && coordinates.length > 0) {
        const validCoords = coordinates.filter(coord => 
          typeof coord.latitude === 'number' && typeof coord.longitude === 'number' &&
          !isNaN(coord.latitude) && !isNaN(coord.longitude)
        );
        
        if (validCoords.length > 0) {
          const avgLat = validCoords.reduce((sum, coord) => sum + coord.latitude, 0) / validCoords.length;
          const avgLng = validCoords.reduce((sum, coord) => sum + coord.longitude, 0) / validCoords.length;
          if (!isNaN(avgLat) && !isNaN(avgLng)) {
            return [avgLng, avgLat];
          }
        }
      }
    } catch (error) {
      console.error('Error in getDefaultCenter:', error);
    }
    
    return fallbackCoords;
  };

  const updateMapMarkers = () => {
    console.log('updateMapMarkers called - Map exists:', !!map.current, 'Coordinates:', coordinates?.length);
    
    if (!map.current) {
      console.warn('No map instance available');
      return;
    }

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add service location marker first
    addServiceLocationMarker();

    if (!coordinates || coordinates.length === 0) {
      console.log('No drop-pin coordinates to display');
      return;
    }

    console.log('=== UPDATE MAP MARKERS DEBUG ===');
    console.log('Total coordinates to display:', coordinates.length);
    console.log('Coordinates data:', coordinates);

    // Add markers for each coordinate with mobile-optimized clustering
    const clusterThreshold = window.innerWidth < 768 ? 5 : 10; // Fewer markers before clustering on mobile
    
    coordinates.forEach((coord, index) => {
      // Validate coordinates before using them
      if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
        console.warn(`Invalid coordinate at index ${index}:`, coord);
        return;
      }
      
      if (isNaN(coord.latitude) || isNaN(coord.longitude)) {
        console.warn(`NaN coordinates at index ${index}:`, coord);
        return;
      }
      
      if (coord.latitude < -90 || coord.latitude > 90 || coord.longitude < -180 || coord.longitude > 180) {
        console.warn(`Out of range coordinates at index ${index}:`, coord);
        return;
      }
      
      console.log(`Adding marker ${index + 1}/${coordinates.length}:`, coord.point_name, [coord.longitude, coord.latitude]);
      
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
        z-index: 1000;
      `;
      
      try {
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
          .addTo(map.current!);

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
        console.log(`Successfully added marker for ${coord.point_name}`);
      } catch (error) {
        console.error(`Error adding marker for ${coord.point_name}:`, error);
      }
    });

    // Fit map to show all markers with mobile-optimized padding
    const validCoords = coordinates.filter(coord => 
      coord && 
      typeof coord.latitude === 'number' && 
      typeof coord.longitude === 'number' && 
      !isNaN(coord.latitude) && 
      !isNaN(coord.longitude) &&
      coord.latitude >= -90 && coord.latitude <= 90 &&
      coord.longitude >= -180 && coord.longitude <= 180
    );
    
    console.log('Valid coordinates for bounds:', validCoords.length, 'out of', coordinates.length);
    
    if (validCoords.length > 1) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        validCoords.forEach(coord => {
          bounds.extend([coord.longitude, coord.latitude]);
        });
        const padding = window.innerWidth < 768 ? 20 : 50;
        map.current!.fitBounds(bounds, { padding, maxZoom: 16 });
        console.log('Map bounds fitted to', validCoords.length, 'coordinates');
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    } else if (validCoords.length === 1) {
      try {
        const coord = validCoords[0];
        map.current!.flyTo({
          center: [coord.longitude, coord.latitude],
          zoom: 18
        });
        console.log('Map centered on single coordinate:', coord.point_name);
      } catch (error) {
        console.error('Error centering on single coordinate:', error);
      }
    } else {
      // No drop pins, center on service location if available
      const serviceCoords = getServiceLocationCoordinates();
      if (serviceCoords && map.current) {
        map.current.flyTo({
          center: [serviceCoords.lng, serviceCoords.lat],
          zoom: 17
        });
        console.log('Map centered on service location');
      }
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

  // Add service location marker
  const addServiceLocationMarker = () => {
    if (!map.current || !serviceLocations || serviceLocations.length === 0) return;

    const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
    if (!primaryLocation) return;

    let coords: [number, number] | null = null;

    // Parse GPS coordinates if available
    if (primaryLocation.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
      const coordStr = primaryLocation.gps_coordinates.replace(/[()]/g, '');
      const parsedCoords = coordStr.split(',').map(Number);
      if (parsedCoords.length === 2 && !isNaN(parsedCoords[1]) && !isNaN(parsedCoords[0])) {
        coords = [parsedCoords[0], parsedCoords[1]]; // [longitude, latitude]
      }
    }

    if (!coords) return;

    // Create distinctive service location marker
    const serviceMarkerEl = document.createElement('div');
    serviceMarkerEl.className = 'service-location-marker';
    serviceMarkerEl.style.cssText = `
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3B82F6, #1E40AF);
      border: 3px solid white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    `;

    // Add icon to marker
    serviceMarkerEl.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;

    const fullAddress = [
      primaryLocation.street,
      primaryLocation.street2,
      primaryLocation.city,
      primaryLocation.state,
      primaryLocation.zip
    ].filter(Boolean).join(', ');

    try {
      const serviceMarker = new mapboxgl.Marker({ element: serviceMarkerEl })
        .setLngLat(coords)
        .setPopup(new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false 
        }).setHTML(`
          <div class="p-3 min-w-[250px]">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 rounded-full bg-blue-500"></div>
              <h4 class="font-bold text-blue-700">Service Location</h4>
            </div>
            <h5 class="font-semibold text-sm mb-1">${primaryLocation.location_name}</h5>
            <p class="text-xs text-gray-600 mb-2">${fullAddress}</p>
            <p class="text-xs text-gray-500 font-mono">${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}</p>
          </div>
        `))
        .addTo(map.current!);

      markers.current.push(serviceMarker);
      console.log('Added service location marker');
    } catch (error) {
      console.error('Error adding service location marker:', error);
    }
  };

  // Get service location coordinates for centering
  const getServiceLocationCoordinates = () => {
    if (!serviceLocations || serviceLocations.length === 0) return null;
    
    const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
    if (!primaryLocation?.gps_coordinates || typeof primaryLocation.gps_coordinates !== 'string') return null;
    
    // Handle both formats: "(-81.83824,41.36749)" and "-81.83824,41.36749"
    const coordStr = primaryLocation.gps_coordinates.replace(/[()]/g, '');
    const coords = coordStr.split(',').map(Number);
    if (coords.length === 2 && !isNaN(coords[1]) && !isNaN(coords[0])) {
      return { lng: coords[0], lat: coords[1] };
    }
    return null;
  };

  const recenterMap = async () => {
    if (map.current) {
      const center = await getDefaultCenter();
      map.current.flyTo({ center, zoom: 17 });
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
      console.log('Attempting to delete coordinate:', coordinateId);
      
      const { error } = await supabase
        .from('service_location_coordinates')
        .delete()
        .eq('id', coordinateId);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      console.log('Delete successful, refreshing data...');
      await refetch();
      
      // Update map markers after delete
      if (map.current) {
        updateMapMarkers();
      }
      
      toast({
        title: "Success",
        description: "GPS drop-pin deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting coordinate:', error);
      toast({
        title: "Error",
        description: `Failed to delete GPS drop-pin: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsExpandedMapOpen(true)}
                    className="p-1 lg:p-2"
                    title="Expand Map View"
                  >
                    <Maximize2 className="w-3 h-3" />
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
                                     <>
                                       <DropdownMenuSeparator />
                                       <AlertDialog>
                                         <AlertDialogTrigger asChild>
                                           <DropdownMenuItem
                                             onSelect={(e) => e.preventDefault()}
                                             className="text-red-600 focus:text-red-600 cursor-pointer"
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
                                     </>
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

      <ExpandedMapModal
        isOpen={isExpandedMapOpen}
        onClose={() => setIsExpandedMapOpen(false)}
        mapboxToken={mapboxToken}
        serviceLocations={serviceLocations || []}
        coordinates={coordinates || []}
        categories={categories || []}
        customerName={customer?.name}
      />
    </div>
  );
}
