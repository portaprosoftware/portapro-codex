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
  const [error, setError] = useState<string | null>(null);
  
  const layerIds = useRef<string[]>([]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const instanceId = useRef(Math.random().toString(36).substr(2, 9));

  // Cleanup function
  const cleanup = useCallback(() => {
    if (!map) return;
    
    // Stop animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    
    // Remove all layers and sources
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
    
    layerIds.current = [];
    setIsAnimating(false);
  }, [map]);

  // Load radar frames
  const loadRadarFrames = useCallback(async () => {
    if (!isActive || !map || !map.isStyleLoaded()) {
      console.log('Radar: Map not ready or radar not active');
      return;
    }

    try {
      console.log('Radar: Loading radar frames...');
      setError(null);
      const radarFrames = await rainViewerService.getRadarFrames();
      
      if (!mountedRef.current) return;
      
      console.log('Radar: Loaded', radarFrames.length, 'frames');
      setFrames(radarFrames);
      
      if (radarFrames.length > 0) {
        // Add sources and layers for each frame
        radarFrames.forEach((frame, index) => {
          const layerId = `radar-${instanceId.current}-${index}`;
          const tileUrl = rainViewerService.getTileUrl(frame.path);
          
          try {
            // Add source
            if (!map.getSource(layerId)) {
              console.log('Radar: Adding source', layerId);
              map.addSource(layerId, {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256
              });
            }
            
            // Add layer
            if (!map.getLayer(layerId)) {
              console.log('Radar: Adding layer', layerId);
              map.addLayer({
                id: layerId,
                type: 'raster',
                source: layerId,
                paint: {
                  'raster-opacity': 0,
                  'raster-fade-duration': 100 // Shorter than animation interval
                }
              });
            }
            
            layerIds.current.push(layerId);
          } catch (error) {
            console.error('Radar: Error adding layer', layerId, error);
          }
        });
        
        // Start animation after frames are loaded
        setTimeout(() => {
          if (radarFrames.length > 1 && !isAnimating && mountedRef.current) {
            console.log('Radar: Starting animation with', radarFrames.length, 'frames');
            startAnimation();
          } else if (radarFrames.length === 1) {
            // Show single frame
            console.log('Radar: Showing single frame');
            updateFrame(0);
          }
        }, 100); // Small delay to ensure layers are added
      }
    } catch (error) {
      console.error('Radar: Error loading frames:', error);
      setError('Failed to load radar data');
    }
  }, [isActive, map, isAnimating]);

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
    
    console.log('Radar: Starting animation with', frames.length, 'frames');
    setIsAnimating(true);
    setCurrentFrame(0);
    
    // Use 600ms interval for smooth animation of 12 frames
    animationRef.current = setInterval(() => {
      if (mountedRef.current) {
        setCurrentFrame(prev => {
          const next = (prev + 1) % frames.length;
          console.log('Radar: Frame', next + 1, 'of', frames.length);
          return next;
        });
      }
    }, 300); // Faster animation - 300ms per frame
  }, [isAnimating]); // Remove frames.length dependency to fix the issue

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

  // Load frames when activated
  useEffect(() => {
    console.log('Radar: Effect triggered - isActive:', isActive, 'mapReady:', map?.isStyleLoaded());
    if (isActive && map && map.isStyleLoaded()) {
      loadRadarFrames();
    } else {
      console.log('Radar: Cleaning up');
      cleanup();
    }
  }, [isActive, map]); // Remove loadRadarFrames from deps to prevent infinite loops

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
        
        {/* Frame info */}
        <div className="flex justify-between items-center bg-slate-800/50 rounded-lg p-2 border border-slate-600/30">
          <div>
            <div className="text-xs text-slate-400 font-medium">FRAME</div>
            <div className="text-white font-semibold">{currentFrame + 1} of {frames.length}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">COVERAGE</div>
            <div className="text-blue-300 text-sm font-medium">90min + 30min</div>
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