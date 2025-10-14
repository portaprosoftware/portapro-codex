interface RadarFrame {
  time: number;
  path: string;
}

// Helper to convert lng/lat to tile coordinates
function lngLatToTile(lng: number, lat: number, zoom: number): { x: number; y: number } {
  const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y };
}

class MapTilerWeatherService {
  private apiKey: string = '';
  
  // Set API key from edge function
  public setApiKey(key: string) {
    this.apiKey = key.trim(); // Ensure no whitespace
  }
  
  // Get radar tile URL with time as query parameter
  public getRadarTileUrl(timestamp: number): string {
    // MapTiler Weather radar tiles format
    // https://api.maptiler.com/tiles/weather/radar/{z}/{x}/{y}.png?time=TIMESTAMP&key=KEY
    return `https://api.maptiler.com/tiles/weather/radar/{z}/{x}/{y}.png?time=${timestamp}&key=${this.apiKey}`;
  }
  
  // Validate timestamps by probing actual tile availability
  private async validateTimestampsWithProbe(
    timestamps: number[], 
    center: { lng: number; lat: number } = { lng: -95, lat: 37 } // Default: center of US
  ): Promise<number[]> {
    const zoom = 4; // Low zoom for probe
    const tile = lngLatToTile(center.lng, center.lat, zoom);
    const validTimestamps: number[] = [];
    
    console.log('MapTiler: Probing timestamps for availability...');
    
    // Test each timestamp with a sample tile
    for (const ts of timestamps) {
      const probeUrl = `https://api.maptiler.com/tiles/weather/radar/${zoom}/${tile.x}/${tile.y}.png?time=${ts}&key=${this.apiKey}`;
      
      try {
        const response = await fetch(probeUrl, { method: 'HEAD' });
        if (response.ok) {
          validTimestamps.push(ts);
        }
      } catch (error) {
        // Tile not available, skip
      }
      
      // Limit to 12 frames for performance
      if (validTimestamps.length >= 12) break;
    }
    
    console.log(`MapTiler: Valid timestamps after probe: ${validTimestamps.length}`);
    return validTimestamps;
  }
  
  // Get available radar timestamps
  public async getRadarFrames(): Promise<RadarFrame[]> {
    try {
      console.log('MapTiler: Fetching radar frames...');
      
      // Generate timestamps for last 2 hours at 5-minute intervals
      const now = Math.floor(Date.now() / 1000);
      const timestamps: number[] = [];
      
      // Generate 24 frames (2 hours at 5-min intervals)
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - (i * 5 * 60); // 5 minutes in seconds
        timestamps.push(timestamp);
      }
      
      // Validate timestamps by probing tile availability
      const validTimestamps = await this.validateTimestampsWithProbe(timestamps);
      
      if (validTimestamps.length === 0) {
        console.warn('MapTiler: No valid radar frames available (after validation)');
        return [];
      }
      
      // Convert to RadarFrame format
      const frames: RadarFrame[] = validTimestamps.map(time => ({
        time,
        path: '' // Not used for MapTiler
      }));
      
      console.log('MapTiler: ✓ Loaded', frames.length, 'validated frames');
      return frames;
      
    } catch (error) {
      console.error('MapTiler: Error getting radar frames:', error);
      return [];
    }
  }
}

export const mapTilerWeatherService = new MapTilerWeatherService();
