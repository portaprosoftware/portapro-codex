import React, { useEffect, useRef, useCallback, useState } from 'react';
import { rainViewerService } from '@/services/rainViewerService';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map;
  isActive: boolean;
}

interface TimeStampDisplayProps {
  frames: { path: string; time: number }[];
  currentFrame: number;
  isActive: boolean;
}

export const SimpleWeatherRadar: React.FC<SimpleWeatherRadarProps> = ({ map, isActive }) => {
  const [frames, setFrames] = useState<{ path: string; time: number }[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const layerIds = useRef<string[]>([]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));

  // Complete cleanup function
  const cleanup = useCallback(() => {
    console.log('SimpleWeatherRadar: Starting cleanup...');
    
    // Stop animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);

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
    setHasLoaded(false);
    setError(null);
    
    // Generate new instance ID for next load
    instanceId.current = Math.random().toString(36).substr(2, 9);
    
    console.log('SimpleWeatherRadar: Cleanup complete');
  }, [map]);

  // Load radar frames
  const loadRadarFrames = useCallback(async () => {
    if (!isActive || !map || !map.isStyleLoaded() || isLoading || hasLoaded) {
      console.log('Radar: Skipping load - active:', isActive, 'map ready:', map?.isStyleLoaded(), 'loading:', isLoading, 'hasLoaded:', hasLoaded);
      return;
    }

    try {
      console.log('SimpleWeatherRadar: Starting to load radar frames...');
      setIsLoading(true);
      setError(null);
      
      const radarFrames = await rainViewerService.getRadarFrames();
      
      if (!mountedRef.current) return;
      
      if (radarFrames.length === 0) {
        console.warn('SimpleWeatherRadar: No radar frames available');
        setFrames([]);
        setIsLoading(false);
        return;
      }

      console.log('SimpleWeatherRadar: Got', radarFrames.length, 'frames, adding to map...');

      // Add sources and layers for each frame
      radarFrames.forEach((frame, index) => {
        const layerId = `radar-${instanceId.current}-${index}`;
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

          // Add layer
          if (!map.getLayer(layerId)) {
            map.addLayer({
              id: layerId,
              type: 'raster',
              source: layerId,
              paint: {
                'raster-opacity': index === 0 ? 0.6 : 0, // Only first frame visible initially
                'raster-fade-duration': 100
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
      setHasLoaded(true);
      console.log('SimpleWeatherRadar: Radar frames loaded successfully');
      
    } catch (error) {
      console.error('SimpleWeatherRadar: Error loading radar frames:', error);
      setError('Failed to load radar data');
      setFrames([]);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, map, isLoading, hasLoaded]);

  // Update frame visibility
  const updateFrame = useCallback((frameIndex: number) => {
    if (!map || layerIds.current.length === 0) return;
    
    try {
      // Hide all layers first
      layerIds.current.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setPaintProperty(layerId, 'raster-opacity', 0);
        }
      });
      
      // Show current frame
      const currentLayerId = layerIds.current[frameIndex];
      if (currentLayerId && map.getLayer(currentLayerId)) {
        map.setPaintProperty(currentLayerId, 'raster-opacity', 0.6);
      }
    } catch (error) {
      console.warn('Error updating frame:', error);
    }
  }, [map]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (animationRef.current || isAnimating) {
      console.log('Radar: Animation already running');
      return;
    }
    
    if (frames.length <= 1) {
      console.log('Radar: Insufficient frames for animation:', frames.length);
      return;
    }
    
    console.log('SimpleWeatherRadar: Starting animation...');
    setIsAnimating(true);
    
    animationRef.current = setInterval(() => {
      if (mountedRef.current) {
        setCurrentFrame(prev => {
          const next = (prev + 1) % frames.length;
          updateFrame(next);
          return next;
        });
      }
    }, 200); // Smoother animation - 200ms per frame
  }, [isAnimating, frames.length, updateFrame]);

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  // Update frame when currentFrame changes
  useEffect(() => {
    if (isActive && frames.length > 0) {
      console.log('Radar: Updating to frame', currentFrame);
      updateFrame(currentFrame);
    }
  }, [currentFrame, frames.length, isActive, updateFrame]);

  // Effect to handle active state changes
  useEffect(() => {
    if (isActive && map && map.isStyleLoaded()) {
      loadRadarFrames();
    } else if (!isActive) {
      cleanup();
    }
  }, [isActive, map, loadRadarFrames, cleanup]);

  // Auto-start animation when frames are loaded
  useEffect(() => {
    if (frames.length > 0 && !isAnimating && isActive && hasLoaded) {
      const timer = setTimeout(() => {
        startAnimation();
      }, 100); // Small delay to ensure layers are ready
      
      return () => clearTimeout(timer);
    }
  }, [frames.length, isAnimating, isActive, hasLoaded, startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return (
    <>
      {isActive && <TimestampDisplay frames={frames} currentFrame={currentFrame} isActive={isActive} />}
    </>
  );
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
    <div className="absolute top-4 left-4 z-10 bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/20">
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