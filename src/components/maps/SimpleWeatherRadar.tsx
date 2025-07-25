import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { weatherService, WeatherRadarLayer } from '@/lib/weatherService';
import { toast } from 'sonner';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  onError?: (error: string) => void;
}

export function SimpleWeatherRadar({ map, enabled, onError }: SimpleWeatherRadarProps) {
  const [frames, setFrames] = useState<WeatherRadarLayer[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(800); // milliseconds

  // Load radar data
  const loadRadarData = useCallback(async () => {
    if (!enabled || !map) return;

    setIsLoading(true);
    try {
      const layers = await weatherService.getRadarLayers();
      if (layers.length > 0) {
        setFrames(layers);
        setCurrentFrame(0);
        console.log('Loaded', layers.length, 'radar frames');
      } else {
        console.log('No radar frames available');
        onError?.('Weather radar data unavailable');
      }
    } catch (error) {
      console.error('Failed to load radar data:', error);
      onError?.('Failed to load weather radar');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, map, onError]);

  // Initialize radar data
  useEffect(() => {
    loadRadarData();
  }, [loadRadarData]);

  // Add radar layers to map
  const addRadarLayers = useCallback(() => {
    if (!map || !frames.length) return;

    frames.forEach((frame, index) => {
      const { id, sourceId, url } = frame;

      // Remove existing layer and source
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      // Add new source and layer
      map.addSource(sourceId, {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        attribution: '© OpenWeatherMap'
      });

      map.addLayer({
        id,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': index === currentFrame ? opacity : 0,
          'raster-fade-duration': 300
        }
      });
    });
  }, [map, frames, currentFrame, opacity]);

  // Remove all radar layers
  const removeRadarLayers = useCallback(() => {
    if (!map || !frames.length) return;

    frames.forEach(frame => {
      const { id, sourceId } = frame;
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });
  }, [map, frames]);

  // Update layer visibility when frame changes
  useEffect(() => {
    if (!map || !frames.length) return;

    frames.forEach((frame, index) => {
      const { id } = frame;
      if (map.getLayer(id)) {
        map.setPaintProperty(id, 'raster-opacity', index === currentFrame ? opacity : 0);
      }
    });
  }, [map, frames, currentFrame, opacity]);

  // Handle enabled/disabled state
  useEffect(() => {
    if (enabled && frames.length > 0) {
      addRadarLayers();
    } else {
      removeRadarLayers();
    }

    return () => {
      if (!enabled) {
        removeRadarLayers();
      }
    };
  }, [enabled, addRadarLayers, removeRadarLayers, frames.length]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating || !enabled || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [isAnimating, enabled, frames.length, animationSpeed]);

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!enabled) return null;

  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg border shadow-lg p-4 min-w-[280px] z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-sm">Weather Radar</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadRadarData}
          disabled={isLoading}
          className="h-7 w-7 p-0"
        >
          <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs text-gray-600">Loading radar data...</p>
        </div>
      ) : frames.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-gray-600">No radar data available</p>
        </div>
      ) : (
        <>
          {/* Animation Controls */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAnimating(!isAnimating)}
              className="h-8 px-3"
            >
              {isAnimating ? (
                <Pause className="w-3 h-3 mr-1" />
              ) : (
                <Play className="w-3 h-3 mr-1" />
              )}
              {isAnimating ? 'Pause' : 'Play'}
            </Button>
            
            <div className="text-xs text-gray-600">
              Frame {currentFrame + 1} of {frames.length}
            </div>
          </div>

          {/* Current Time Display */}
          {frames[currentFrame] && (
            <div className="text-center mb-3">
              <div className="text-xs font-medium text-gray-800">
                {formatTime(frames[currentFrame].timestamp)}
              </div>
            </div>
          )}

          {/* Frame Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(((currentFrame + 1) / frames.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${((currentFrame + 1) / frames.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Opacity Control */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Opacity</span>
              <span>{Math.round(opacity * 100)}%</span>
            </div>
            <Slider
              value={[opacity]}
              onValueChange={([value]) => setOpacity(value)}
              max={1}
              min={0.1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Animation Speed Control */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Speed</span>
              <span>{animationSpeed < 500 ? 'Fast' : animationSpeed < 1000 ? 'Normal' : 'Slow'}</span>
            </div>
            <Slider
              value={[2000 - animationSpeed]}
              onValueChange={([value]) => setAnimationSpeed(2000 - value)}
              max={1800}
              min={200}
              step={200}
              className="w-full"
            />
          </div>

          {/* Radar Legend */}
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-medium text-gray-700 mb-2">Precipitation Intensity</div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span>Light</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Heavy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span>Intense</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}