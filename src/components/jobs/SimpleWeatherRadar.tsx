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
  const animationFrameRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));
  const lastFrameTime = useRef<number>(0);
  const isAnimatingRef = useRef(false);
  const originalScrollZoom = useRef<boolean | null>(null);

  // Complete cleanup function
  const cleanup = useCallback(() => {
    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAnimatingRef.current = false;

    // Restore scroll zoom if it was disabled
    if (map && originalScrollZoom.current !== null) {
      if (originalScrollZoom.current) {
        map.scrollZoom.enable();
      }
      originalScrollZoom.current = null;
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
    
    // Generate new instance ID for next load
    instanceId.current = Math.random().toString(36).substr(2, 9);
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

      // Temporarily disable scroll zoom to prevent conflicts
      if (map.scrollZoom.isEnabled()) {
        originalScrollZoom.current = true;
        map.scrollZoom.disable();
      } else {
        originalScrollZoom.current = false;
      }

      // Add sources and layers for each frame
      const batchSize = 3; // Process in smaller batches
      for (let i = 0; i < radarFrames.length; i += batchSize) {
        const batch = radarFrames.slice(i, i + batchSize);
        
        batch.forEach((frame, batchIndex) => {
          const index = i + batchIndex;
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

            // Add layer with visibility instead of opacity
            if (!map.getLayer(layerId)) {
              map.addLayer({
                id: layerId,
                type: 'raster',
                source: layerId,
                layout: {
                  visibility: index === 0 ? 'visible' : 'none'
                },
                paint: {
                  'raster-opacity': 0.6,
                  'raster-fade-duration': 0
                }
              });
            }

            layerIds.current.push(layerId);
          } catch (error) {
            console.error('Radar: Error adding layer', layerId, error);
          }
        });

        // Small delay between batches to prevent overwhelming the map
        await new Promise(resolve => setTimeout(resolve, 10));
      }

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

  // Update frame visibility using layout property
  const updateFrame = useCallback((frameIndex: number) => {
    if (!map || layerIds.current.length === 0) return;
    
    try {
      // Batch visibility updates
      const updates: Array<{ layerId: string; visible: boolean }> = [];
      
      layerIds.current.forEach((layerId, index) => {
        updates.push({
          layerId,
          visible: index === frameIndex
        });
      });

      // Apply all updates at once
      updates.forEach(({ layerId, visible }) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
      });
    } catch (error) {
      console.warn('Error updating frame:', error);
    }
  }, [map]);

  // Animation loop using requestAnimationFrame
  const animate = useCallback((timestamp: number) => {
    if (!mountedRef.current || !isAnimatingRef.current || frames.length <= 1) {
      return;
    }

    // Control animation speed (500ms per frame)
    if (timestamp - lastFrameTime.current >= 500) {
      setCurrentFrame(prev => {
        const next = (prev + 1) % frames.length;
        updateFrame(next);
        return next;
      });
      lastFrameTime.current = timestamp;
    }

    // Continue animation
    if (isAnimatingRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [frames.length, updateFrame]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current || frames.length <= 1) {
      return;
    }
    
    isAnimatingRef.current = true;
    lastFrameTime.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [frames.length, animate]);

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

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
    if (frames.length > 0 && isActive && !isLoading) {
      // Notify parent about initial frames
      onFramesUpdate?.(frames, currentFrame);
      
      // Re-enable scroll zoom after a short delay
      const enableZoomTimer = setTimeout(() => {
        if (map && originalScrollZoom.current === true) {
          map.scrollZoom.enable();
          originalScrollZoom.current = null;
        }
      }, 1000);
      
      // Start animation
      const animationTimer = setTimeout(() => {
        startAnimation();
      }, 100);
      
      return () => {
        clearTimeout(enableZoomTimer);
        clearTimeout(animationTimer);
      };
    }
  }, [frames.length, isActive, isLoading, startAnimation, onFramesUpdate, currentFrame, map]);

  // Update frame display when currentFrame changes
  useEffect(() => {
    if (isActive && frames.length > 0) {
      updateFrame(currentFrame);
      onFramesUpdate?.(frames, currentFrame);
    }
  }, [currentFrame, frames.length, isActive, updateFrame, onFramesUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      stopAnimation();
      cleanup();
    };
  }, [cleanup, stopAnimation]);

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