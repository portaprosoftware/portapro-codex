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
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  const layerIds = useRef<string[]>([]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Map interaction handlers
  const handleUserInteractionStart = useCallback(() => {
    setIsUserInteracting(true);
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const handleUserInteractionEnd = useCallback(() => {
    // Debounced resume - wait 1 second after interaction ends
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 1000);
  }, []);

  // Complete cleanup function
  const cleanup = useCallback(() => {
    console.log('SimpleWeatherRadar: Starting cleanup...');
    
    // Stop animation and resume timer
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    setIsAnimating(false);

    // Remove map event listeners
    if (map) {
      try {
        map.off('zoomstart', handleUserInteractionStart);
        map.off('dragstart', handleUserInteractionStart);
        map.off('touchstart', handleUserInteractionStart);
        map.off('zoomend', handleUserInteractionEnd);
        map.off('dragend', handleUserInteractionEnd);
        map.off('touchend', handleUserInteractionEnd);
      } catch (error) {
        console.warn('Error removing map event listeners:', error);
      }

      // Remove all radar layers and sources
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
    setIsUserInteracting(false);
    
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

      // Set up map event listeners for interaction detection
      if (map) {
        map.on('zoomstart', handleUserInteractionStart);
        map.on('dragstart', handleUserInteractionStart);
        map.on('touchstart', handleUserInteractionStart);
        map.on('zoomend', handleUserInteractionEnd);
        map.on('dragend', handleUserInteractionEnd);
        map.on('touchend', handleUserInteractionEnd);
      }
      
    } catch (error) {
      console.error('SimpleWeatherRadar: Error loading radar frames:', error);
      setError('Failed to load radar data');
      setFrames([]);
    } finally {
      setIsLoading(false);
    }
  }, [isActive, map, isLoading, hasLoaded, handleUserInteractionStart, handleUserInteractionEnd]);

  // Update frame visibility
  const updateFrame = useCallback((frameIndex: number) => {
    if (!map || layerIds.current.length === 0 || isUserInteracting) return;
    
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
  }, [map, isUserInteracting]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (animationRef.current || isAnimating || isUserInteracting) {
      console.log('Radar: Animation already running or user interacting');
      return;
    }
    
    if (frames.length <= 1) {
      console.log('Radar: Insufficient frames for animation:', frames.length);
      return;
    }
    
    console.log('SimpleWeatherRadar: Starting animation...');
    setIsAnimating(true);
    
    animationRef.current = setInterval(() => {
      if (mountedRef.current && !isUserInteracting) {
        setCurrentFrame(prev => {
          const next = (prev + 1) % frames.length;
          updateFrame(next);
          return next;
        });
      }
    }, 200); // Smoother animation - 200ms per frame
  }, [isAnimating, frames.length, updateFrame, isUserInteracting]);

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
      
      // Notify parent component about frame updates
      onFramesUpdate?.(frames, currentFrame);
    }
  }, [currentFrame, frames.length, isActive, updateFrame, onFramesUpdate]);

  // Effect to handle active state changes
  useEffect(() => {
    if (isActive && map && map.isStyleLoaded()) {
      loadRadarFrames();
    } else if (!isActive) {
      cleanup();
    }
  }, [isActive, map, loadRadarFrames, cleanup]);

  // Auto-start animation when frames are loaded and user is not interacting
  useEffect(() => {
    if (frames.length > 0 && !isAnimating && isActive && hasLoaded && !isUserInteracting) {
      // Notify parent about initial frames
      onFramesUpdate?.(frames, currentFrame);
      
      const timer = setTimeout(() => {
        startAnimation();
      }, 100); // Small delay to ensure layers are ready
      
      return () => clearTimeout(timer);
    }
  }, [frames.length, isAnimating, isActive, hasLoaded, startAnimation, onFramesUpdate, currentFrame, isUserInteracting]);

  // Stop animation when user starts interacting
  useEffect(() => {
    if (isUserInteracting && isAnimating) {
      console.log('Radar: Pausing animation due to user interaction');
      stopAnimation();
    }
  }, [isUserInteracting, isAnimating, stopAnimation]);

  // Resume animation when user stops interacting
  useEffect(() => {
    if (!isUserInteracting && !isAnimating && frames.length > 0 && isActive && hasLoaded) {
      console.log('Radar: Resuming animation after user interaction');
      const timer = setTimeout(() => {
        startAnimation();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isUserInteracting, isAnimating, frames.length, isActive, hasLoaded, startAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return null; // No longer rendering timestamp display here
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