/**
 * Dynamic loader for Mapbox GL
 * Prevents mapbox-gl from landing in main bundle
 */

import { getMapboxToken } from '@/env.client';

export async function loadMapboxLibs() {
  const [mapboxMod] = await Promise.all([
    import('mapbox-gl'),
    import('mapbox-gl/dist/mapbox-gl.css'),
  ]);
  
  const mapboxgl = mapboxMod.default;
  
  // Auto-configure access token
  try {
    mapboxgl.accessToken = await getMapboxToken();
  } catch (error) {
    console.error('Failed to configure Mapbox token:', error);
    throw error;
  }
  
  return mapboxgl;
}

export type MapboxGL = Awaited<ReturnType<typeof loadMapboxLibs>>;
