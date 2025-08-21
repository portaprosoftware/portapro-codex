import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export interface InventoryLocation {
  id: string;
  product_name: string;
  item_code: string;
  status: string;
  customer_name: string;
  customer_address: string;
  latitude: number;
  longitude: number;
  job_type: string;
  scheduled_date: string;
  customer_phone?: string;
  quantity: number;
}

interface UseInventoryMarkerManagerProps {
  map: mapboxgl.Map | null;
  locations: InventoryLocation[];
  onLocationSelect: (location: InventoryLocation) => void;
}

const statusColors = {
  assigned: '#3b82f6',
  delivered: '#10b981',
  in_service: '#f59e0b',
  maintenance: '#ef4444',
  available: '#6b7280'
};

export const useInventoryMarkerManager = ({
  map,
  locations,
  onLocationSelect
}: UseInventoryMarkerManagerProps) => {
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const locationsHashRef = useRef<string>('');

  useEffect(() => {
    if (!map || !locations?.length) return;

    // Create hash of current locations to avoid unnecessary updates
    const newHash = JSON.stringify(locations.map(l => ({ id: l.id, lat: l.latitude, lng: l.longitude, status: l.status })));
    
    if (newHash === locationsHashRef.current) return;
    locationsHashRef.current = newHash;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Calculate bounds
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(location => {
      bounds.extend([location.longitude, location.latitude]);
    });

    // Fit map to bounds with padding
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { 
        padding: 80,
        maxZoom: 15
      });
    }

    // Create static markers using direct DOM manipulation
    locations.forEach((location, index) => {
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
      
      pinElement.textContent = location.quantity > 1 ? location.quantity.toString() : (index + 1).toString();
      
      // Simple click handler with stopPropagation
      pinElement.addEventListener('click', (e) => {
        e.stopPropagation();
        onLocationSelect(location);
      });

      const marker = new mapboxgl.Marker({
        element: pinElement,
        anchor: 'center',
        draggable: false,
        rotation: 0,
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      })
      .setLngLat([location.longitude, location.latitude])
      .addTo(map);

      markersRef.current.push(marker);
    });

  }, [map, locations, onLocationSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);
};