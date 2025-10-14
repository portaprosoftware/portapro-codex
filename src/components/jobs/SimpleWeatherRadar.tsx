import React from 'react';
import mapboxgl from 'mapbox-gl';

interface SimpleWeatherRadarProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
  onError?: (error: string) => void;
  onFramesUpdate?: (count: number) => void;
}

export function SimpleWeatherRadar({ map, enabled, onError, onFramesUpdate }: SimpleWeatherRadarProps) {
  // Weather radar temporarily disabled - MapTiler requires their SDK which has compatibility issues
  // Alternative radar solutions (RainViewer, Open-Meteo) can be implemented if needed
  return null;
}
