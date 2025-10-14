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
  
  // Get radar tile URL with timestamp path segment (correct format)
  public getRadarTileUrl(timestamp: number): string {
    // MapTiler Weather radar tiles format:
    // https://api.maptiler.com/tiles/radar/{timestamp}/{z}/{x}/{y}.png?key=KEY
    return `https://api.maptiler.com/tiles/radar/${timestamp}/{z}/{x}/{y}.png?key=${this.apiKey}`;
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
      const probeUrl = `https://api.maptiler.com/tiles/radar/${ts}/${zoom}/${tile.x}/${tile.y}.png?key=${this.apiKey}`;
      
      try {
        const response = await fetch(probeUrl, { method: 'GET', cache: 'no-store' });
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
      console.log('MapTiler: Generating radar frames (aligned to 5-min grid)...');
      
      const now = Math.floor(Date.now() / 1000);
      const roundedNow = Math.floor(now / 300) * 300; // align to 5-min boundary
      const timestamps: number[] = [];
      
      // Generate 12 frames (1 hour at 5-min intervals) for smoother animation
      for (let i = 11; i >= 0; i--) {
        const timestamp = roundedNow - (i * 5 * 60);
        timestamps.push(timestamp);
      }
      
      const frames: RadarFrame[] = timestamps.map(time => ({ time, path: '' }));
      console.log('MapTiler: ✓ Generated', frames.length, 'frames');
      return frames;
      
    } catch (error) {
      console.error('MapTiler: Error getting radar frames:', error);
      return [];
    }
  }
}

export const mapTilerWeatherService = new MapTilerWeatherService();
