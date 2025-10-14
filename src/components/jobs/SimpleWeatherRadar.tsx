import React, { useEffect, useRef, useCallback, useState } from 'react';
import { mapTilerWeatherService } from '@/services/mapTilerWeatherService';
import { supabase } from '@/integrations/supabase/client';

// Animation timing (critical for smooth playback)
const ANIMATION_INTERVAL = 300; // milliseconds
const RASTER_FADE_DURATION = 200; // milliseconds (must be less than interval)
const RADAR_OPACITY = 0.7;

interface RadarFrame {
  path: string;
  time: number;
}

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  onError?: (error: string) => void;
  onFramesUpdate?: (frames: RadarFrame[], currentFrame: number) => void;
}

interface TimestampDisplayProps {
  frames: RadarFrame[];
  currentFrame: number;
  isActive: boolean;
}

import { formatTimestampToAMPMInTimezone } from '@/lib/dateUtils';
import { getCompanyTimezone } from '@/lib/timezoneUtils';

// Simple timestamp to AM/PM formatting in company timezone
export function formatTimestampToAMPM(timestamp: number): string {
  return formatTimestampToAMPMInTimezone(timestamp, getCompanyTimezone());
}

export const SimpleWeatherRadar: React.FC<SimpleWeatherRadarProps> = ({ 
  map, 
  enabled, 
  onError,
  onFramesUpdate 
}) => {
  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [apiKey, setApiKey] = useState<string>('');
  
  const mountedRef = useRef(true);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const layerIds = useRef<string[]>([]);
  const isStyleChanging = useRef(false);

  // 🔍 DEBUG: Log component mount
  useEffect(() => {
    console.log('🚀 SimpleWeatherRadar: Component MOUNTED', {
      enabled,
      hasMap: !!map,
      mapLoaded: map?.loaded(),
      mapStyleLoaded: map?.isStyleLoaded()
    });
  }, []);

  // Add layers to map from stored frames/data
  const addRadarLayers = useCallback(() => {
    if (!map || !frames.length || !apiKey) return;
    
    console.log('MapTiler: Adding layers to map...');
    
    // Clear existing layers first
    layerIds.current.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(layerId)) {
          map.removeSource(layerId);
        }
      } catch (error) {
        console.warn('MapTiler: Error removing layer:', layerId, error);
      }
    });
    layerIds.current = [];
    
    // Add sources and layers for each frame
    frames.forEach((frame, index) => {
      const layerId = `radar-layer-${frame.time}-${index}`;
      const tileUrl = mapTilerWeatherService.getRadarTileUrl(frame.time);

      try {
        if (!map.getSource(layerId)) {
          map.addSource(layerId, {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: '© MapTiler'
          });
        }

        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: layerId,
            paint: {
              'raster-opacity': 0,
              'raster-fade-duration': RASTER_FADE_DURATION,
              'raster-resampling': 'linear'
            },
            layout: {
              'visibility': 'visible'
            }
          });
        }

        layerIds.current.push(layerId);
      } catch (error) {
        console.error('MapTiler: Error adding layer:', layerId, error);
      }
    });
    
    // Show first frame
    if (layerIds.current.length > 0) {
      const firstLayerId = layerIds.current[0];
      if (firstLayerId && map.getLayer(firstLayerId)) {
        map.setPaintProperty(firstLayerId, 'raster-opacity', RADAR_OPACITY);
        console.log('MapTiler: ✓ Layers added, first frame visible');
      }
    }
  }, [map, frames, apiKey]);

  // Load radar frames - fetch data and API key
  const loadRadarFrames = useCallback(async () => {
    if (!map || !enabled) {
      console.log('❌ SimpleWeatherRadar: EARLY RETURN TRIGGERED', {
        hasMap: !!map,
        enabled: enabled
      });
      return;
    }

    try {
      console.log('✅ MapTiler: Loading radar data...');
      
      // Fetch MapTiler API key from edge function (only if not cached)
      if (!apiKey) {
        const { data, error } = await supabase.functions.invoke('get-maptiler-key');
        
        if (error || !data?.apiKey) {
          console.error('MapTiler: Failed to get API key:', error);
          if (onError) {
            onError('Failed to get MapTiler API key');
          }
          return;
        }
        
        setApiKey(data.apiKey);
        mapTilerWeatherService.setApiKey(data.apiKey);
      }
      
      const radarFrames = await mapTilerWeatherService.getRadarFrames();
      
      if (!mountedRef.current && !isStyleChanging.current) {
        console.log('MapTiler: Component unmounted, aborting');
        return;
      }
      
      if (radarFrames.length === 0) {
        console.warn('MapTiler: No radar frames available');
        setFrames([]);
        return;
      }

      console.log('MapTiler: ✓ Loaded', radarFrames.length, 'frames');
      setFrames(radarFrames);
      setCurrentFrame(0);
      
    } catch (error) {
      console.error('MapTiler: ✗ Error loading radar frames:', error);
      setFrames([]);
    }
  }, [map, enabled, onError, apiKey]);

  // Frame update logic - hide all, then show current
  const updateFrame = useCallback(() => {
    if (!map || !frames.length || !layerIds.current.length) return;

    try {
      // Hide all layers first
      layerIds.current.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'raster-opacity', 0);
        }
      });

      // Show current frame
      const currentLayerId = layerIds.current[currentFrame];
      if (currentLayerId && map.getLayer(currentLayerId)) {
        map.setPaintProperty(currentLayerId, 'raster-opacity', RADAR_OPACITY);
      }
    } catch (error) {
      console.error('Error updating frame:', error);
    }
  }, [map, frames.length, currentFrame]);

  // Animation loop - your exact working pattern
  useEffect(() => {
    if (!enabled || !frames.length) {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Core animation timing - this is what makes it smooth
    animationRef.current = setInterval(() => {
      if (mountedRef.current) {
        setCurrentFrame(prev => {
          const next = (prev + 1) % frames.length;
          return next;
        });
      }
    }, ANIMATION_INTERVAL); // 300ms interval

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [enabled, frames.length]);

  // Update frame when currentFrame changes
  useEffect(() => {
    updateFrame();
    onFramesUpdate?.(frames, currentFrame);
  }, [updateFrame, frames, currentFrame, onFramesUpdate]);

  // Load frames when enabled
  useEffect(() => {
    if (enabled && map) {
      console.log('✅ SimpleWeatherRadar: Loading radar data...');
      loadRadarFrames();
    }
  }, [enabled, map, loadRadarFrames]);
  
  // Add layers when frames are loaded or map style changes
  useEffect(() => {
    if (!map || !frames.length || !apiKey) return;
    
    const handleStyleData = () => {
      console.log('MapTiler: Map style changed, re-adding layers...');
      isStyleChanging.current = true;
      addRadarLayers();
      isStyleChanging.current = false;
    };
    
    // Add layers initially
    addRadarLayers();
    
    // Re-add layers when map style changes
    map.on('styledata', handleStyleData);
    
    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [map, frames, apiKey, addRadarLayers]);

  // Cleanup on unmount (only on true unmount, not style changes)
  useEffect(() => {
    return () => {
      if (!isStyleChanging.current) {
        console.log('MapTiler: Component unmounting, cleaning up...');
        mountedRef.current = false;
        if (animationRef.current) {
          clearInterval(animationRef.current);
        }
        
        // Clean up layers
        if (map) {
          layerIds.current.forEach(layerId => {
            try {
              if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
              }
              if (map.getSource(layerId)) {
                map.removeSource(layerId);
              }
            } catch (error) {
              console.warn('Error cleaning up layer:', error);
            }
          });
        }
      }
    };
  }, [map]);

  return null; // This component doesn't render anything visible
};

export const TimestampDisplay: React.FC<TimestampDisplayProps> = ({ 
  frames, 
  currentFrame, 
  isActive 
}) => {
  if (!isActive || !frames.length || currentFrame >= frames.length) {
    return null;
  }

  const current = frames[currentFrame];
  const startTime = frames[0]?.time;
  const endTime = frames[frames.length - 1]?.time;

  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border text-xs text-gray-600">
      <div className="flex items-center gap-2">
        <span className="font-medium">Now:</span>
        <span>{formatTimestampToAMPM(current.time)}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Range: {formatTimestampToAMPM(startTime)} - {formatTimestampToAMPM(endTime)}
      </div>
    </div>
  );
};