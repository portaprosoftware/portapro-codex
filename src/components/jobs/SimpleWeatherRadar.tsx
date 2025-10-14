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
  
  const mountedRef = useRef(true);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const layerIds = useRef<string[]>([]);

  // 🔍 DEBUG: Log component mount
  useEffect(() => {
    console.log('🚀 SimpleWeatherRadar: Component MOUNTED', {
      enabled,
      hasMap: !!map,
      mapLoaded: map?.loaded(),
      mapStyleLoaded: map?.isStyleLoaded()
    });
  }, []);

  // Load radar frames - using your exact working pattern
  const loadRadarFrames = useCallback(async () => {
    if (!map || !enabled) {
      console.log('SimpleWeatherRadar: Skipping load - map:', !!map, 'enabled:', enabled);
      return;
    }

    try {
      console.log('MapTiler: Loading radar frames...');
      console.log('MapTiler: Map loaded state:', map.loaded());
      console.log('MapTiler: Map style loaded state:', map.isStyleLoaded());
      
      // Fetch MapTiler API key from edge function
      const { data, error } = await supabase.functions.invoke('get-maptiler-key');
      
      if (error || !data?.apiKey) {
        console.error('MapTiler: Failed to get API key:', error);
        if (onError) {
          onError('Failed to get MapTiler API key');
        }
        return;
      }
      
      // Set API key in service
      mapTilerWeatherService.setApiKey(data.apiKey);
      
      const radarFrames = await mapTilerWeatherService.getRadarFrames();
      
      if (!mountedRef.current) {
        console.log('MapTiler: Component unmounted, aborting');
        return;
      }
      
      if (radarFrames.length === 0) {
        console.warn('MapTiler: No radar frames available');
        setFrames([]);
        return;
      }

      console.log('MapTiler: Processing', radarFrames.length, 'radar frames');

      // Clear existing layers
      console.log('MapTiler: Clearing', layerIds.current.length, 'existing layers');
      layerIds.current.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
            console.log('MapTiler: Removed layer:', layerId);
          }
          if (map.getSource(layerId)) {
            map.removeSource(layerId);
            console.log('MapTiler: Removed source:', layerId);
          }
        } catch (error) {
          console.warn('MapTiler: Error removing layer:', layerId, error);
        }
      });
      layerIds.current = [];

      // Wait for map to be ready if needed
      if (!map.isStyleLoaded()) {
        console.log('MapTiler: Waiting for map style to load...');
        await new Promise(resolve => {
          if (map.isStyleLoaded()) {
            resolve(true);
          } else {
            map.once('styledata', resolve);
          }
        });
      }

      console.log('MapTiler: Adding sources and layers...');
      // Add sources and layers for each frame
      radarFrames.forEach((frame, index) => {
        const layerId = `radar-layer-${frame.time}-${index}`;
        const tileUrl = mapTilerWeatherService.getRadarTileUrl(frame.time);

        console.log(`MapTiler: Creating layer ${index + 1}/${radarFrames.length}:`, layerId);
        console.log('MapTiler: Tile URL:', tileUrl);

        try {
          // Add source
          if (!map.getSource(layerId)) {
            console.log('MapTiler: Adding source for:', layerId);
            map.addSource(layerId, {
              type: 'raster',
              tiles: [tileUrl],
              tileSize: 256,
              attribution: '© MapTiler'
            });
            console.log('MapTiler: ✓ Source added for:', layerId);
          } else {
            console.log('MapTiler: Source already exists for:', layerId);
          }

          // Raster layer configuration with clipping for smooth transitions
          if (!map.getLayer(layerId)) {
            console.log('MapTiler: Adding layer for:', layerId);
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: layerId,
              paint: {
                'raster-opacity': 0,
                'raster-fade-duration': RASTER_FADE_DURATION,  // Key: shorter than animation interval
                'raster-resampling': 'linear' // Smoother rendering
              },
              layout: {
                'visibility': 'visible'
              }
            });
            console.log('MapTiler: ✓ Layer added for:', layerId);
          } else {
            console.log('MapTiler: Layer already exists for:', layerId);
          }

          layerIds.current.push(layerId);
          console.log('MapTiler: ✓ Layer ID stored:', layerId);
        } catch (error) {
          console.error('MapTiler: ✗ Error adding layer:', layerId, error);
        }
      });

      console.log('MapTiler: Created', layerIds.current.length, 'layers total');
      setFrames(radarFrames);
      setCurrentFrame(0);
      console.log('MapTiler: ✓ Loaded', radarFrames.length, 'frames');
      
      // CRITICAL FIX: Immediately show the first frame
      if (layerIds.current.length > 0) {
        console.log('MapTiler: Setting up initial frame display...');
        
        // Hide all layers first
        layerIds.current.forEach((layerId, idx) => {
          if (map.getLayer(layerId)) {
            map.setPaintProperty(layerId, 'raster-opacity', 0);
            console.log(`MapTiler: Hidden layer ${idx}:`, layerId);
          }
        });
        
        // Show first frame immediately
        const firstLayerId = layerIds.current[0];
        if (firstLayerId && map.getLayer(firstLayerId)) {
          map.setPaintProperty(firstLayerId, 'raster-opacity', RADAR_OPACITY);
          console.log('MapTiler: ✓ First frame visible:', firstLayerId, 'opacity:', RADAR_OPACITY);
        } else {
          console.error('MapTiler: ✗ Failed to show first frame - layer not found:', firstLayerId);
        }
      } else {
        console.error('MapTiler: ✗ No layers created - cannot show radar');
      }
      
    } catch (error) {
      console.error('MapTiler: ✗ Error loading radar frames:', error);
      setFrames([]);
    }
  }, [map, enabled, onError]);

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
    console.log('🔍 SimpleWeatherRadar: Load frames effect triggered', {
      enabled,
      hasMap: !!map,
      mapLoaded: map?.loaded(),
      mapStyleLoaded: map?.isStyleLoaded(),
      willLoad: enabled && !!map
    });
    
    if (enabled && map) {
      console.log('✅ SimpleWeatherRadar: Conditions met, calling loadRadarFrames()');
      loadRadarFrames();
    } else {
      console.log('❌ SimpleWeatherRadar: Conditions NOT met for loading', {
        enabled,
        hasMap: !!map
      });
    }
  }, [enabled, map, loadRadarFrames]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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