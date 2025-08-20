import React, { useEffect, useRef, useCallback, useState } from 'react';
import { rainViewerService } from '@/services/rainViewerService';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map;
  isActive: boolean;
  onFramesUpdate?: (frames: { path: string; time: number }[], currentFrame: number) => void;
}

interface TimeStampDisplayProps {
  frames: { path: string; time: number }[];
  currentFrame: number;
  isActive: boolean;
}

export const SimpleWeatherRadar: React.FC<SimpleWeatherRadarProps> = ({ map, isActive, onFramesUpdate }) => {
  const [frames, setFrames] = useState<{ path: string; time: number }[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const layerIds = useRef<string[]>([]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Complete cleanup function
  const cleanup = useCallback(() => {
    // Stop animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    // Remove all radar layers and sources
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
          console.warn('Error removing layer/source:', layerId, error);
        }
      });
    }

    // Reset all state
    layerIds.current = [];
    setFrames([]);
    setCurrentFrame(0);
    setError(null);
  }, [map]);

  // Load radar frames
  const loadRadarFrames = useCallback(async () => {
    if (!isActive || !map || !map.isStyleLoaded() || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const radarFrames = await rainViewerService.getRadarFrames();
      
      if (!mountedRef.current) return;
      
      if (radarFrames.length === 0) {
        setFrames([]);
        setIsLoading(false);
        return;
      }

      // Add sources and layers for each frame
      radarFrames.forEach((frame, index) => {
        const layerId = `radar-layer-${index}`;
        const tileUrl = rainViewerService.getTileUrl(frame.path);

        try {
          // Add source
          if (!map.getSource(layerId)) {
            map.addSource(layerId, {
              type: 'raster',
              tiles: [tileUrl],
              tileSize: 256,
              maxzoom: 12
            });
          }

          // Add layer with opacity control for smooth transitions
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: layerId,
              paint: {
                'raster-opacity': 0,
                'raster-fade-duration': 200  // Key: shorter than animation interval
              }
            });
          }

          layerIds.current.push(layerId);
        } catch (error) {
          console.error('Radar: Error adding layer', layerId, error);
        }
      });

      setFrames(radarFrames);
      setCurrentFrame(0);
      
    } catch (error) {
      console.error('SimpleWeatherRadar: Error loading radar frames:', error);
      setError('Failed to load radar data');
      setFrames([]);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, map, isLoading]);

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
        map.setPaintProperty(currentLayerId, 'raster-opacity', 0.7);
      }
    } catch (error) {
      console.error('Error updating frame:', error);
    }
  }, [map, frames.length, currentFrame]);

  // Effect to handle active state changes
  useEffect(() => {
    if (isActive && map && map.isStyleLoaded()) {
      loadRadarFrames();
    } else if (!isActive) {
      cleanup();
    }
  }, [isActive, map, loadRadarFrames, cleanup]);

  // Start animation when frames are loaded
  useEffect(() => {
    if (frames.length > 0 && isActive && !isLoading) {
      // Core animation timing - this is what makes it smooth
      animationRef.current = setInterval(() => {
        if (mountedRef.current) {
          setCurrentFrame(prev => {
            const next = (prev + 1) % frames.length;
            return next;
          });
        }
      }, 300); // 300ms interval

      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      };
    }
  }, [frames.length, isActive, isLoading]);

  // Update frame display when currentFrame changes
  useEffect(() => {
    if (isActive && frames.length > 0) {
      updateFrame();
      onFramesUpdate?.(frames, currentFrame);
    }
  }, [currentFrame, frames.length, isActive, updateFrame, onFramesUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return null;
};

// Timestamp display component
const TimestampDisplay: React.FC<TimeStampDisplayProps> = ({ frames, currentFrame, isActive }) => {
  if (!isActive || frames.length === 0) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCurrentTime = () => {
    if (frames[currentFrame]) {
      return frames[currentFrame].time;
    }
    return Date.now() / 1000;
  };

  const getTimeRange = () => {
    if (frames.length === 0) return { start: '', end: '' };
    
    const startTime = frames[0].time;
    const endTime = frames[frames.length - 1].time;
    
    return {
      start: `${formatDate(startTime)} ${formatTime(startTime)}`,
      end: `${formatDate(endTime)} ${formatTime(endTime)}`
    };
  };

  const timeRange = getTimeRange();
  const currentTime = getCurrentTime();

  return (
    <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/20">
      <div className="p-4 space-y-3">
        {/* Header with PortaPro branding */}
        <div className="flex items-center gap-2 pb-2 border-b border-blue-500/20">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold text-sm tracking-wide">WEATHER RADAR</span>
        </div>
        
        {/* Current time - prominent display */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-3 border border-blue-400/30">
          <div className="text-xs text-blue-300 font-medium mb-1">CURRENT TIME</div>
          <div className="text-white font-bold text-lg">
            {formatTime(currentTime)}
          </div>
          <div className="text-blue-200 text-sm">
            {formatDate(currentTime)}
          </div>
        </div>
        
        {/* Time range */}
        <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-600/20">
          <div className="text-xs text-slate-400 font-medium mb-1">TIME RANGE</div>
          <div className="text-slate-200 text-xs leading-relaxed">
            <div>{timeRange.start}</div>
            <div className="text-slate-400">↓</div>
            <div>{timeRange.end}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export the TimestampDisplay component for use in parent
export { TimestampDisplay };