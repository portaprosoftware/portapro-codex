import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, Satellite, Map as MapIcon, RotateCcw, Maximize2 } from 'lucide-react';

interface ExpandedMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapboxToken: string | null;
  serviceLocations: any[];
  coordinates: any[];
  categories: any[];
  customerName?: string;
}

export function ExpandedMapModal({
  isOpen,
  onClose,
  mapboxToken,
  serviceLocations,
  coordinates,
  categories,
  customerName
}: ExpandedMapModalProps) {
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || !mapboxToken || !mapContainer.current) return;

    const initMap = async () => {
      mapboxgl.accessToken = mapboxToken;

      const center = await getDefaultCenter();

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: getMapStyle(),
        center: center,
        zoom: 16
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right');

      map.current.on('load', () => {
        updateMapMarkers();
      });

      // Update markers when map is ready
      setTimeout(() => {
        updateMapMarkers();
      }, 500);
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen, mapboxToken]);

  // Update map style
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(getMapStyle());
    }
  }, [mapStyle]);

  // Update markers when data changes
  useEffect(() => {
    if (map.current && isOpen) {
      updateMapMarkers();
    }
  }, [coordinates, serviceLocations, isOpen]);

  const getMapStyle = () => {
    switch (mapStyle) {
      case 'satellite': return 'mapbox://styles/mapbox/satellite-v9';
      default: return 'mapbox://styles/mapbox/streets-v12';
    }
  };

  const getDefaultCenter = async (): Promise<[number, number]> => {
    const fallbackCoords: [number, number] = [-79.9959, 40.4406];
    
    if (serviceLocations && serviceLocations.length > 0) {
      const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
      
      if (primaryLocation && primaryLocation.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
        const coordStr = primaryLocation.gps_coordinates.replace(/[()]/g, '');
        const coords = coordStr.split(',').map(Number);
        if (coords.length === 2 && !isNaN(coords[1]) && !isNaN(coords[0])) {
          return [coords[0], coords[1]];
        }
      }
    }
    
    return fallbackCoords;
  };

  const addServiceLocationMarker = () => {
    if (!map.current || !serviceLocations || serviceLocations.length === 0) return;

    const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
    if (!primaryLocation) return;

    let coords: [number, number] | null = null;

    if (primaryLocation.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
      const coordStr = primaryLocation.gps_coordinates.replace(/[()]/g, '');
      const parsedCoords = coordStr.split(',').map(Number);
      if (parsedCoords.length === 2 && !isNaN(parsedCoords[1]) && !isNaN(parsedCoords[0])) {
        coords = [parsedCoords[0], parsedCoords[1]];
      }
    }

    if (!coords) return;

    const serviceMarkerEl = document.createElement('div');
    serviceMarkerEl.className = 'service-location-marker';
    serviceMarkerEl.style.cssText = `
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #3B82F6, #1E40AF);
      border: 4px solid white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 6px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    `;

    serviceMarkerEl.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
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
          <div class="p-4 min-w-[300px]">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-4 h-4 rounded-full bg-blue-500"></div>
              <h4 class="font-bold text-blue-700 text-lg">Service Location</h4>
            </div>
            <h5 class="font-semibold text-base mb-2">${primaryLocation.location_name}</h5>
            <p class="text-sm text-gray-600 mb-3">${fullAddress}</p>
            <p class="text-sm text-gray-500 font-mono">${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}</p>
          </div>
        `))
        .addTo(map.current!);

      markers.current.push(serviceMarker);
    } catch (error) {
      console.error('Error adding service location marker:', error);
    }
  };

  const updateMapMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add service location marker
    addServiceLocationMarker();

    // Add GPS drop pins
    if (coordinates && coordinates.length > 0) {
      coordinates.forEach((coord, index) => {
        if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') {
          return;
        }
        
        if (isNaN(coord.latitude) || isNaN(coord.longitude)) {
          return;
        }
        
        if (coord.latitude < -90 || coord.latitude > 90 || coord.longitude < -180 || coord.longitude > 180) {
          return;
        }
        
        const color = getCategoryColor(coord.category);
        
        const markerEl = document.createElement('div');
        markerEl.className = 'gps-drop-pin-marker';
        markerEl.style.cssText = `
          width: 40px;
          height: 40px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        `;

        markerEl.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        `;
        
        try {
          const marker = new mapboxgl.Marker({ element: markerEl })
            .setLngLat([coord.longitude, coord.latitude])
            .setPopup(new mapboxgl.Popup({ 
              offset: 25,
              closeButton: true,
              closeOnClick: false 
            }).setHTML(`
              <div class="p-4 min-w-[250px]">
                <h4 class="font-semibold text-base mb-2">${coord.point_name}</h4>
                ${coord.description ? `<p class="text-sm text-gray-600 mb-3">${coord.description}</p>` : ''}
                <p class="text-sm text-gray-500 font-mono mb-3">${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}</p>
                ${coord.category ? `<span class="inline-block px-3 py-1 text-sm bg-gray-100 rounded-full">${coord.category}</span>` : ''}
              </div>
            `))
            .addTo(map.current!);

          markerEl.addEventListener('mouseenter', () => {
            markerEl.style.transform = 'scale(1.1)';
          });
          
          markerEl.addEventListener('mouseleave', () => {
            markerEl.style.transform = 'scale(1)';
          });

          markers.current.push(marker);
        } catch (error) {
          console.error(`Error adding marker for ${coord.point_name}:`, error);
        }
      });

      // Fit map to show all markers
      fitMapToMarkers();
    }
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return '#EF4444';
    
    const categoryData = categories.find(cat => cat.name === category);
    return categoryData?.color || '#EF4444';
  };

  const fitMapToMarkers = () => {
    if (!map.current || !coordinates || coordinates.length === 0) return;

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
        const coord = validCoords[0];
        map.current.flyTo({
          center: [coord.longitude, coord.latitude],
          zoom: 18,
          duration: 1000
        });
      } else {
        const bounds = new mapboxgl.LngLatBounds();
        
        // Include service location in bounds
        if (serviceLocations && serviceLocations.length > 0) {
          const primaryLocation = serviceLocations.find(loc => loc.is_default) || serviceLocations[0];
          if (primaryLocation?.gps_coordinates && typeof primaryLocation.gps_coordinates === 'string') {
            const coordStr = primaryLocation.gps_coordinates.replace(/[()]/g, '');
            const coords = coordStr.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[1]) && !isNaN(coords[0])) {
              bounds.extend([coords[0], coords[1]]);
            }
          }
        }
        
        validCoords.forEach(coord => {
          bounds.extend([coord.longitude, coord.latitude]);
        });
        
        map.current.fitBounds(bounds, { 
          padding: 60,
          maxZoom: 16,
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Error fitting bounds:', error);
    }
  };

  const recenterMap = async () => {
    if (map.current) {
      const center = await getDefaultCenter();
      map.current.flyTo({ center, zoom: 16, duration: 1000 });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 border-b bg-white relative z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">
                GPS Map View - {customerName}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {/* Map Controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={mapStyle === 'satellite' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMapStyle('satellite')}
                    className="h-8 px-3"
                  >
                    <Satellite className="w-4 h-4 mr-1" />
                    Satellite
                  </Button>
                  <Button
                    variant={mapStyle === 'streets' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMapStyle('streets')}
                    className="h-8 px-3"
                  >
                    <MapIcon className="w-4 h-4 mr-1" />
                    Streets
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={recenterMap}
                  className="h-8 px-3"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Recenter
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Map Container */}
          <div className="flex-1 relative">
            <div ref={mapContainer} className="absolute inset-0" />
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10 max-w-xs">
              <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                  <span>Service Location</span>
                </div>
                {categories && categories.length > 0 && categories.map(category => (
                  <div key={category.id} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}