import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Cloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nwsRadarService, NWSRadarLayer } from '@/lib/nwsRadarService';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  onError?: (error: string) => void;
}

export function SimpleWeatherRadar({ map, enabled, onError }: SimpleWeatherRadarProps) {
  const [frames, setFrames] = useState<NWSRadarLayer[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use refs for proper cleanup and tracking
  const mountedRef = useRef(true);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const layerIds = useRef<string[]>([]);
  const instanceId = useRef(Date.now().toString());

  // Load radar data
  const loadRadarData = useCallback(async () => {
    if (!enabled || !map || !mountedRef.current) return;

    setIsLoading(true);
    try {
      const layers = await nwsRadarService.getRadarLayers();
      if (layers.length > 0 && mountedRef.current) {
        // Limit frames to last 8 past + first 4 future (like working radar)
        const limitedLayers = layers.slice(-12); // Take last 12 frames
        setFrames(limitedLayers);
        
        // Start from current time (find the frame closest to now)
        const now = Date.now() / 1000;
        const currentFrameIndex = limitedLayers.findIndex((layer, index) => {
          if (index === limitedLayers.length - 1) return true; // Last frame if none found
          return limitedLayers[index + 1].timestamp > now;
        });
        setCurrentFrame(Math.max(0, currentFrameIndex));
        console.log('Loaded', limitedLayers.length, 'NWS radar frames');
      } else {
        console.log('No weather radar frames available');
        onError?.('Weather radar data unavailable');
      }
    } catch (error) {
      console.error('Failed to load weather radar data:', error);
      onError?.('Failed to load weather radar');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
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

  // Add radar layers to map (only once)
  const addRadarLayers = useCallback(() => {
    if (!map || !frames.length || layerIds.current.length > 0) return;

    try {
      frames.forEach((frame, index) => {
        // Create unique layer ID with instance ID and timestamp
        const layerId = `radar-${instanceId.current}-${frame.timestamp}`;
        const sourceId = `radar-source-${instanceId.current}-${frame.timestamp}`;
        
        layerIds.current.push(layerId);

        // Add new source and layer
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [frame.url],
          tileSize: 256,
          attribution: '© NOAA/NWS'
        });

        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: {
            'raster-opacity': 0,
            'raster-fade-duration': 200 // Shorter than animation interval
          }
        });
      });

      console.log('Added', frames.length, 'radar layers with unique IDs');
    } catch (error) {
      console.error('Error adding radar layers:', error);
      onError?.('Failed to add radar layers');
    }
  }, [map, frames, onError]);

  // Remove all radar layers
  const removeRadarLayers = useCallback(() => {
    if (!map || layerIds.current.length === 0) return;

    try {
      layerIds.current.forEach(layerId => {
        const sourceId = layerId.replace('radar-', 'radar-source-');
        
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
      
      layerIds.current = [];
      console.log('Removed radar layers');
    } catch (error) {
      console.error('Error removing radar layers:', error);
    }
  }, [map]);

  // Update frame visibility - key: hide all, then show current
  const updateFrame = useCallback(() => {
    if (!map || !frames.length || layerIds.current.length === 0) return;

    try {
      // Hide all layers first (prevents blinking)
      layerIds.current.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'raster-opacity', 0);
        }
      });

      // Show current frame
      const currentLayerId = layerIds.current[currentFrame];
      if (currentLayerId && map.getLayer(currentLayerId)) {
        map.setPaintProperty(currentLayerId, 'raster-opacity', 0.7);
      }
    } catch (error) {
      console.error('Error updating frame:', error);
    }
  }, [map, frames.length, currentFrame]);

  // Add layers when frames are loaded
  useEffect(() => {
    if (enabled && frames.length > 0 && layerIds.current.length === 0) {
      addRadarLayers();
    }
  }, [enabled, frames.length, addRadarLayers]);

  // Update visibility when frame changes
  useEffect(() => {
    updateFrame();
  }, [updateFrame]);

  // Handle enabled/disabled state
  useEffect(() => {
    if (!enabled) {
      removeRadarLayers();
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (!enabled) {
        removeRadarLayers();
      }
    };
  }, [enabled, removeRadarLayers]);

  // Animation loop - smooth 300ms intervals (like working radar)
  useEffect(() => {
    // Clear existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    if (!isAnimating || !enabled || frames.length <= 1 || layerIds.current.length === 0) {
      return;
    }

    // Start new animation with 300ms interval
    animationRef.current = setInterval(() => {
      if (mountedRef.current) {
        setCurrentFrame(prev => {
          const next = (prev + 1) % frames.length;
          return next;
        });
      }
    }, 300); // 300ms interval like working radar

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isAnimating, enabled, frames.length, layerIds.current.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      removeRadarLayers();
    };
  }, [removeRadarLayers]);

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