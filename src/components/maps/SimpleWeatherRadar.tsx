import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { weatherService, WeatherRadarLayer } from '@/lib/weatherService';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  onError?: (error: string) => void;
}

export function SimpleWeatherRadar({ map, enabled, onError }: SimpleWeatherRadarProps) {
  const [currentLayer, setCurrentLayer] = useState<WeatherRadarLayer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Load current radar layer
  const loadRadarData = useCallback(async () => {
    if (!enabled || !map) return;

    setIsLoading(true);
    try {
      const layer = await weatherService.getCurrentLayer();
      if (layer) {
        setCurrentLayer(layer);
        setLastRefresh(new Date());
        console.log('Loaded current weather radar layer');
      } else {
        console.log('No weather radar layer available');
        onError?.('Weather radar data unavailable');
      }
    } catch (error) {
      console.error('Failed to load weather radar data:', error);
      onError?.('Failed to load weather radar');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, map, onError]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!enabled) return;

    loadRadarData();
    const interval = setInterval(() => {
      loadRadarData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [enabled, loadRadarData]);

  // Add radar layer to map
  const addRadarLayer = useCallback(() => {
    if (!map || !currentLayer) return;

    const { id, sourceId, url } = currentLayer;

    // Remove existing layer and source
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Add new source and layer
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [url],
      tileSize: 256,
      attribution: '© OpenWeatherMap'
    });

    map.addLayer({
      id,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': 0.8,
        'raster-fade-duration': 300
      }
    });

    console.log('Added weather radar layer to map');
  }, [map, currentLayer]);

  // Remove radar layer
  const removeRadarLayer = useCallback(() => {
    if (!map || !currentLayer) return;

    const { id, sourceId } = currentLayer;
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    console.log('Removed weather radar layer from map');
  }, [map, currentLayer]);

  // Handle enabled/disabled state
  useEffect(() => {
    if (enabled && currentLayer) {
      addRadarLayer();
    } else {
      removeRadarLayer();
    }

    return () => {
      if (!enabled) {
        removeRadarLayer();
      }
    };
  }, [enabled, addRadarLayer, removeRadarLayer, currentLayer]);

  // Manual refresh handler
  const handleRefresh = () => {
    loadRadarData();
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!enabled) return null;

  return (
    <>
      {/* Radar Status Badge */}
      {currentLayer && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg z-10 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>Live Weather Radar</span>
            {lastRefresh && (
              <span className="text-blue-200">
                • Updated {formatTime(lastRefresh)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
        {isLoading && (
          <div className="text-sm text-gray-600 mb-2 flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading weather radar...</span>
          </div>
        )}
        
        {!currentLayer && !isLoading && (
          <div className="text-sm text-red-600 mb-2">
            Weather radar not available
          </div>
        )}
        
        {currentLayer && !isLoading && (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <span className="text-xs text-gray-600">
              Current
            </span>
          </div>
        )}

        {/* Legend */}
        {currentLayer && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-medium text-gray-700 mb-2">Weather Intensity</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-300 rounded"></div>
                <span>Light</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded"></div>
                <span>Heavy</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded"></div>
                <span>Severe</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}