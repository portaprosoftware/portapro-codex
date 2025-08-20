import React, { useEffect, useRef, useCallback, useState } from 'react';
import { rainViewerService } from '@/services/rainViewerService';

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

  // Load radar frames - using your exact working pattern
  const loadRadarFrames = useCallback(async () => {
    if (!map || !enabled) return;

    try {
      console.log('SimpleWeatherRadar: Loading radar frames...');
      
      const radarFrames = await rainViewerService.getRadarFrames();
      
      if (!mountedRef.current) return;
      
      if (radarFrames.length === 0) {
        console.warn('No radar frames available');
        setFrames([]);
        return;
      }

      // Clear existing layers
      layerIds.current.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getSource(layerId)) {
            map.removeSource(layerId);
          }
        } catch (error) {
          console.warn('Error removing layer:', error);
        }
      });
      layerIds.current = [];

      // Add sources and layers for each frame
      radarFrames.forEach((frame, index) => {
        const layerId = `radar-layer-${frame.time}-${index}`;
        const tileUrl = rainViewerService.getTileUrl(frame.path);

        try {
          // Add source
          if (!map.getSource(layerId)) {
            map.addSource(layerId, {
              type: 'raster',
              tiles: [tileUrl],
              tileSize: 256,
              attribution: '© RainViewer'
            });
          }

          // Raster layer configuration for smooth transitions
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: layerId,
              paint: {
                'raster-opacity': 0,
                'raster-fade-duration': RASTER_FADE_DURATION  // Key: shorter than animation interval
              }
            });
          }

          layerIds.current.push(layerId);
        } catch (error) {
          console.error('Error adding radar layer:', error);
        }
      });

      setFrames(radarFrames);
      setCurrentFrame(0);
      console.log('SimpleWeatherRadar: Loaded', radarFrames.length, 'frames');
      
    } catch (error) {
      console.error('SimpleWeatherRadar: Error loading radar frames:', error);
      setFrames([]);
    }
  }, [map, enabled]);

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
      loadRadarFrames();
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