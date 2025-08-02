import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface JobsMapViewProps {
  searchTerm?: string;
  selectedDriver?: string;
  jobType?: string;
  status?: string;
  selectedDate: Date;
}

const JobsMapPage = ({ searchTerm, selectedDriver, jobType, status, selectedDate }: JobsMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [serviceLocations, setServiceLocations] = useState<any[]>([]);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Get Mapbox token
  useEffect(() => {
    const getToken = async () => {
      try {
        const response = await fetch(`https://unpnuonbndubcuzxfnmg.supabase.co/functions/v1/get-mapbox-token`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucG51b25ibmR1YmN1enhmbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzkyMjgsImV4cCI6MjA2NDcxNTIyOH0.goME2hFzqxm0tnFdXAB_0evuiueh8wWfGLIY1vvvqmE`
          }
        });
        const data = await response.json();
        if (data.token) {
          setMapboxToken(data.token);
        } else {
          const stored = localStorage.getItem('mapbox-token');
          if (stored) setMapboxToken(stored);
        }
      } catch (error) {
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

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Changed to streets style
      center: [-95.7129, 37.0902],
      zoom: 4
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Fetch jobs data - completely isolated from React Query
  useEffect(() => {
    if (!selectedDate || !mapboxToken) return;

    const fetchData = async () => {
      try {
        // Convert date to string for SQL query
        const dateStr = selectedDate.getFullYear() + '-' + 
          String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(selectedDate.getDate()).padStart(2, '0');

        // Direct Supabase call - no React Query
        const { data: jobsData } = await supabase
          .from('jobs')
          .select(`
            id,
            job_number,
            job_type,
            status,
            customer_id,
            driver_id,
            vehicle_id,
            customers (
              id,
              name
            ),
            profiles (
              id,
              first_name,
              last_name
            ),
            vehicles (
              id,
              license_plate
            )
          `)
          .eq('scheduled_date', dateStr);

        // Get service locations
        const { data: locationsData } = await supabase
          .from('customer_service_locations')
          .select('id, customer_id, gps_coordinates');

        setJobs(jobsData || []);
        setServiceLocations(locationsData || []);

      } catch (error) {
        console.error('Fetch error:', error);
        setJobs([]);
        setServiceLocations([]);
      }
    };

    fetchData();
  }, [selectedDate, mapboxToken]);

  // Create pins - your exact working pattern
  useEffect(() => {
    if (!map.current || !jobs.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasCoordinates = false;

    jobs.forEach(job => {
      let coordinates = null;

      // Jobs don't have gps_coordinates, so find service location
      const location = serviceLocations.find(loc => 
        loc.customer_id === job.customer_id && 
        loc.gps_coordinates
      );
      
      if (location?.gps_coordinates) {
        // Parse coordinates from string format "(-81.83824,41.36749)"
        const coordStr = location.gps_coordinates.replace(/[()]/g, '');
        const [lng, lat] = coordStr.split(',').map(parseFloat);
        coordinates = [lng, lat];
      }

      if (!coordinates) return;

      hasCoordinates = true;
      bounds.extend(coordinates);

      // Pin colors
      const colors = {
        delivery: '#3B82F6',
        pickup: '#EF4444', 
        service: '#F59E0B',
        return: '#10B981'
      };

      // Job codes
      const codes = {
        delivery: 'D',
        pickup: 'P',
        service: 'S', 
        return: 'R'
      };

      const color = colors[job.job_type] || '#6B7280';
      const code = codes[job.job_type] || 'J';

      // Create pin element - your exact inline pattern
      const pinEl = document.createElement('div');
      pinEl.innerHTML = `<div style="width: 28px; height: 28px; background-color: ${color}; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${code}</div>`;

      // Click handler
      pinEl.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPin(job);
      });

      // Add marker
      const marker = new mapboxgl.Marker(pinEl)
        .setLngLat(coordinates)
        .addTo(map.current);

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (hasCoordinates) {
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [jobs, serviceLocations]);

  if (loading) {
    return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!mapboxToken) {
    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
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
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      {selectedPin && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'white',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '300px',
          zIndex: 10
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{selectedPin.job_number}</div>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>Type: {selectedPin.job_type}</div>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>Status: {selectedPin.status}</div>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>Customer: {selectedPin.customers?.name}</div>
          {selectedPin.profiles && (
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              Driver: {selectedPin.profiles.first_name} {selectedPin.profiles.last_name}
            </div>
          )}
          {selectedPin.vehicles && (
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              Vehicle: {selectedPin.vehicles.license_plate}
            </div>
          )}
          <button 
            onClick={() => setSelectedPin(null)}
            style={{ 
              padding: '4px 8px', 
              background: '#f0f0f0', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(255,255,255,0.9)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 10
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Job Types</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#3B82F6', borderRadius: '50%' }}></div>
          <span>Delivery (D)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#EF4444', borderRadius: '50%' }}></div>
          <span>Pickup (P)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#F59E0B', borderRadius: '50%' }}></div>
          <span>Service (S)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#10B981', borderRadius: '50%' }}></div>
          <span>Return (R)</span>
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          Jobs: {jobs.length}
        </div>
      </div>
    </div>
  );
};

export default JobsMapPage;