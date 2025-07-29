import React, { useEffect, useRef, useCallback, useState } from 'react';
import { rainViewerService } from '@/services/rainViewerService';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map;
  isActive: boolean;
}

export const SimpleWeatherRadar: React.FC<SimpleWeatherRadarProps> = ({ map, isActive }) => {
  const [frames, setFrames] = useState<{ path: string; time: number }[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
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
    if (!isActive || !map) return;

    try {
      const radarFrames = await rainViewerService.getRadarFrames();
      if (!mountedRef.current) return;
      
      setFrames(radarFrames);
      
      if (radarFrames.length > 0) {
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
                tileSize: 256
              });
            }
            
            // Add layer
            if (!map.getLayer(layerId)) {
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
            console.warn('Error adding radar layer:', layerId, error);
          }
        });
        
        // Start animation if we have multiple frames
        if (radarFrames.length > 1 && !isAnimating) {
          startAnimation();
        }
      }
    } catch (error) {
      console.error('Error loading radar frames:', error);
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
    if (animationRef.current || isAnimating || frames.length <= 1) return;
    
    setIsAnimating(true);
    setCurrentFrame(0);
    
    // Use 800ms interval to prevent flashing (much slower than the original 300ms)
    animationRef.current = setInterval(() => {
      if (mountedRef.current) {
        setCurrentFrame(prev => {
          const next = (prev + 1) % frames.length;
          return next;
        });
      }
    }, 800); // Slower animation to prevent flashing
  }, [frames.length, isAnimating]);

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
      updateFrame(currentFrame);
    }
  }, [currentFrame, frames.length, isActive, updateFrame]);

  // Load frames when activated
  useEffect(() => {
    if (isActive && map) {
      loadRadarFrames();
    } else {
      cleanup();
    }
  }, [isActive, map, loadRadarFrames, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return null; // This component doesn't render anything visible
};