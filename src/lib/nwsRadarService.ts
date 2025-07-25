export interface NWSRadarFrame {
  url: string;
  timestamp: number;
  type: 'precipitation';
}

export interface NWSRadarLayer {
  id: string;
  sourceId: string;
  url: string;
  timestamp: number;
  type: 'precipitation';
}

class NWSRadarService {
  private frames: NWSRadarFrame[] = [];
  private isLoaded = false;
  private baseUrl = 'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer';

  public async getRadarFrames(): Promise<NWSRadarFrame[]> {
    if (!this.isLoaded) {
      await this.loadFrames();
    }
    return this.frames;
  }

  public async getRadarLayers(): Promise<NWSRadarLayer[]> {
    const frames = await this.getRadarFrames();
    
    // Return last 12 frames for animation
    const limitedFrames = frames.slice(-12);
    
    return limitedFrames.map((frame, index) => ({
      id: `nws-radar-${index}`,
      sourceId: `nws-radar-source-${index}`,
      url: frame.url,
      timestamp: frame.timestamp,
      type: frame.type
    }));
  }

  private async loadFrames(): Promise<void> {
    try {
      // Get time info from NWS service
      const timeInfoResponse = await fetch(`${this.baseUrl}?f=json`);
      const timeInfo = await timeInfoResponse.json();
      
      if (!timeInfo.timeInfo || !timeInfo.timeInfo.timeExtent) {
        console.warn('No time extent available from NWS radar service');
        this.frames = [];
        this.isLoaded = true;
        return;
      }

      const timeExtent = timeInfo.timeInfo.timeExtent;
      const startTime = timeExtent[0];
      const endTime = timeExtent[1];
      
      // Generate time stamps for last 2 hours (12 frames, 10 minutes apart)
      const frames: NWSRadarFrame[] = [];
      const now = Date.now();
      const frameCount = 12;
      const intervalMs = 10 * 60 * 1000; // 10 minutes
      
      for (let i = frameCount - 1; i >= 0; i--) {
        const timestamp = now - (i * intervalMs);
        const timestampSeconds = Math.floor(timestamp / 1000);
        
        // Create tile URL for this timestamp
        const tileUrl = this.createTileUrl(timestamp);
        
        frames.push({
          url: tileUrl,
          timestamp: timestampSeconds,
          type: 'precipitation'
        });
      }

      this.frames = frames;
      this.isLoaded = true;
      
      console.log('NWS radar loaded', this.frames.length, 'radar frames');
    } catch (error) {
      console.error('Failed to load NWS radar data:', error);
      this.frames = [];
      this.isLoaded = true;
    }
  }

  private createTileUrl(timestamp: number): string {
    // Use XYZ tile format compatible with Mapbox
    // NOAA provides NEXRAD tiles through their ArcGIS server
    const tileUrl = `https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer/tile/{z}/{y}/{x}?time=${timestamp}`;
    return tileUrl;
  }

  // Convert XYZ tile coordinates to bbox for NWS service
  private tile2bbox(x: number, y: number, z: number): string {
    const n = Math.PI - 2.0 * Math.PI * y / Math.pow(2.0, z);
    const west = x / Math.pow(2.0, z) * 360.0 - 180.0;
    const east = (x + 1) / Math.pow(2.0, z) * 360.0 - 180.0;
    const north = 180.0 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    const south = 180.0 / Math.PI * Math.atan(0.5 * (Math.exp(n - 2.0 * Math.PI / Math.pow(2.0, z)) - Math.exp(-n + 2.0 * Math.PI / Math.pow(2.0, z))));
    
    // Convert to Web Mercator (EPSG:3857)
    const westMerc = west * 20037508.34 / 180;
    const eastMerc = east * 20037508.34 / 180;
    const northMerc = Math.log(Math.tan((90 + north) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
    const southMerc = Math.log(Math.tan((90 + south) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
    
    return `${westMerc},${southMerc},${eastMerc},${northMerc}`;
  }

  public async refreshData(): Promise<void> {
    this.isLoaded = false;
    await this.loadFrames();
  }

  public isAvailable(): boolean {
    return this.frames.length > 0;
  }
}

// Export singleton instance
export const nwsRadarService = new NWSRadarService();