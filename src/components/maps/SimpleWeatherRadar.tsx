import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { nwsRadarService, NWSRadarLayer } from '@/lib/nwsRadarService';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  onError?: (error: string) => void;
}

export const SimpleWeatherRadar: React.FC<SimpleWeatherRadarProps> = ({ 
  map, 
  enabled,
  onError 
}) => {
  const [radarLayer, setRadarLayer] = useState<NWSRadarLayer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const isMountedRef = useRef(true);
  const addedLayerIdsRef = useRef<string[]>([]);
  const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));

  const loadRadarData = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      console.log('Loading NWS radar data...');
      const layer = nwsRadarService.getRadarLayer();
      
      if (!isMountedRef.current) return;
      
      setRadarLayer(layer);
      console.log('NWS radar data loaded');
      
    } catch (error) {
      console.error('Error loading radar data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to load radar data';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const addRadarLayers = async () => {
    if (!map || !radarLayer) return;
    
    console.log('Adding NWS radar layer to map...');
    
    try {
      removeRadarLayers();
      
      const layerId = `${radarLayer.id}-${instanceIdRef.current}`;
      const sourceId = `${radarLayer.sourceId}-${instanceIdRef.current}`;
      
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [radarLayer.url],
          tileSize: 256
        });
      }
      
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': 0.6
          }
        });
        
        addedLayerIdsRef.current.push(layerId);
      }
      
      console.log('NWS radar layer added successfully');
    } catch (error) {
      console.error('Error adding radar layer:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to add radar layer';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    }
  };

  const removeRadarLayers = () => {
    if (!map) return;

    try {
      addedLayerIdsRef.current.forEach(layerId => {
        const sourceId = layerId.replace(radarLayer?.id || 'nws-radar', radarLayer?.sourceId || 'nws-radar-source');
        
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
      
      addedLayerIdsRef.current = [];
      console.log('NWS radar layers removed');
    } catch (error) {
      console.error('Error removing radar layers:', error);
    }
  };

  // Load radar data when component mounts or when enabled changes
  useEffect(() => {
    if (enabled) {
      loadRadarData();
    } else {
      setRadarLayer(null);
      setErrorMessage('');
    }
  }, [enabled]);

  // Add/remove layers when map or radar data changes
  useEffect(() => {
    if (!map) return;

    if (enabled && radarLayer) {
      addRadarLayers();
    } else {
      removeRadarLayers();
    }
  }, [map, enabled, radarLayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (map) {
        removeRadarLayers();
      }
    };
  }, []);

  const handleRefresh = async () => {
    await loadRadarData();
  };

  if (!enabled) return null;

  return (
    <div className="absolute top-4 left-4 z-10 space-y-2">
      {/* Radar Status Badge */}
      {radarLayer && (
        <Badge variant="secondary" className="bg-black/80 text-white border-0">
          NWS Radar (Live)
        </Badge>
      )}
      
      {/* Control Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-black/80 text-white border-0 hover:bg-black/90"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <Badge variant="secondary" className="bg-blue-600/90 text-white border-0">
          Loading radar...
        </Badge>
      )}
      
      {/* Error Display */}
      {errorMessage && (
        <Badge variant="destructive" className="bg-red-600/90 text-white border-0 max-w-48">
          {errorMessage}
        </Badge>
      )}
      
      {/* Attribution */}
      <Badge variant="outline" className="bg-black/80 text-white border-white/20 text-xs">
        © NWS
      </Badge>
    </div>
  );
};