import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Cloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { rainViewerService, RainViewerLayer } from '@/lib/rainViewerService';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  onError?: (error: string) => void;
}

export function SimpleWeatherRadar({ map, enabled, onError }: SimpleWeatherRadarProps) {
  const [frames, setFrames] = useState<RainViewerLayer[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load radar data
  const loadRadarData = useCallback(async () => {
    if (!enabled || !map) return;

    setIsLoading(true);
    try {
      const layers = await rainViewerService.getRadarLayers();
      if (layers.length > 0) {
        setFrames(layers);
        // Start from current time (find the frame closest to now)
        const now = Date.now() / 1000;
        const currentFrameIndex = layers.findIndex((layer, index) => {
          if (index === layers.length - 1) return true; // Last frame if none found
          return layers[index + 1].timestamp > now;
        });
        setCurrentFrame(Math.max(0, currentFrameIndex));
        console.log('Loaded', layers.length, 'RainViewer radar frames');
      } else {
        console.log('No weather radar frames available');
        onError?.('Weather radar data unavailable');
      }
    } catch (error) {
      console.error('Failed to load weather radar data:', error);
      onError?.('Failed to load weather radar');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, map, onError]);

  // Initialize radar data and auto-refresh every 10 minutes
  useEffect(() => {
    if (!enabled) return;

    loadRadarData();
    const interval = setInterval(() => {
      loadRadarData();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [enabled, loadRadarData]);

  // Add radar layers to map
  const addRadarLayers = useCallback(() => {
    if (!map || !frames.length) return;

    frames.forEach((frame, index) => {
      const { id, sourceId, url } = frame;

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
        attribution: '© RainViewer'
      });

      map.addLayer({
        id,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': index === currentFrame ? 0.8 : 0,
          'raster-fade-duration': 300
        }
      });
    });
  }, [map, frames, currentFrame]);

  // Remove all radar layers
  const removeRadarLayers = useCallback(() => {
    if (!map || !frames.length) return;

    frames.forEach(frame => {
      const { id, sourceId } = frame;
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });
  }, [map, frames]);

  // Update layer visibility when frame changes
  useEffect(() => {
    if (!map || !frames.length) return;

    frames.forEach((frame, index) => {
      const { id } = frame;
      if (map.getLayer(id)) {
        map.setPaintProperty(id, 'raster-opacity', index === currentFrame ? 0.8 : 0);
      }
    });
  }, [map, frames, currentFrame]);

  // Handle enabled/disabled state
  useEffect(() => {
    if (enabled && frames.length > 0) {
      addRadarLayers();
    } else {
      removeRadarLayers();
    }

    return () => {
      if (!enabled) {
        removeRadarLayers();
      }
    };
  }, [enabled, addRadarLayers, removeRadarLayers, frames.length]);

  // Animation loop - 1 second intervals like TV weather
  useEffect(() => {
    if (!isAnimating || !enabled || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isAnimating, enabled, frames.length]);

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRadarTimeRange = () => {
    if (frames.length === 0) return '';
    const firstTime = formatTime(frames[0].timestamp);
    const lastTime = formatTime(frames[frames.length - 1].timestamp);
    return `Radar: ${firstTime} - ${lastTime}`;
  };

  const getCurrentFrameStatus = () => {
    if (frames.length === 0) return '';
    const currentTime = Date.now() / 1000;
    const frameTime = frames[currentFrame]?.timestamp;
    
    if (!frameTime) return '';
    
    if (frameTime < currentTime - 60) {
      return 'Past';
    } else if (frameTime > currentTime + 60) {
      return 'Future';
    } else {
      return 'Current';
    }
  };

  if (!enabled) return null;

  return (
    <>
      {/* Radar Time Badge */}
      {frames.length > 0 && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg z-10 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4" />
            <span>{getRadarTimeRange()}</span>
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
        
        {frames.length === 0 && !isLoading && (
          <div className="text-sm text-red-600 mb-2">
            Weather radar not available
          </div>
        )}
        
        {frames.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAnimating(!isAnimating)}
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadRadarData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <div className="text-xs text-gray-600">
              <div>{formatTime(frames[currentFrame]?.timestamp)}</div>
              <div className="text-xs text-blue-600 font-medium">{getCurrentFrameStatus()}</div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}