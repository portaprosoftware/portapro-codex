interface RadarFrame {
  time: number;
  path: string;
}

interface MapTilerRadarData {
  frames: RadarFrame[];
  host: string;
}

class MapTilerWeatherService {
  private apiKey: string = '';
  
  // Set API key from edge function
  public setApiKey(key: string) {
    this.apiKey = key;
  }
  
  // MapTiler Weather provides radar tiles directly
  public getRadarTileUrl(timestamp: number): string {
    // MapTiler Weather format: 
    // https://api.maptiler.com/tiles/radar/{timestamp}/{z}/{x}/{y}.png?key={apiKey}
    return `https://api.maptiler.com/tiles/radar/${timestamp}/{z}/{x}/{y}.png?key=${this.apiKey}`;
  }
  
  // Get available radar timestamps (last 2 hours at 5-minute intervals)
  public async getRadarFrames(): Promise<RadarFrame[]> {
    try {
      console.log('MapTiler: Fetching radar frames...');
      
      // Get current time and calculate past timestamps
      const now = Math.floor(Date.now() / 1000);
      const frames: RadarFrame[] = [];
      
      // Generate frames for last 2 hours (5-minute intervals = 24 frames)
      // This matches the typical radar animation pattern
      for (let i = 23; i >= 0; i--) {
        const timestamp = now - (i * 5 * 60); // 5 minutes in seconds
        frames.push({
          time: timestamp,
          path: '' // Not used for MapTiler, but kept for compatibility
        });
      }
      
      console.log('MapTiler: Generated', frames.length, 'radar frames');
      return frames;
      
    } catch (error) {
      console.error('MapTiler: Error getting radar frames:', error);
      return [];
    }
  }
}

export const mapTilerWeatherService = new MapTilerWeatherService();
