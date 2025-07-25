export interface RainViewerFrame {
  url: string;
  timestamp: number;
  type: 'precipitation';
}

export interface RainViewerLayer {
  id: string;
  sourceId: string;
  url: string;
  timestamp: number;
  type: 'precipitation';
}

class RainViewerService {
  private frames: RainViewerFrame[] = [];
  private isLoaded = false;

  public async getRadarFrames(): Promise<RainViewerFrame[]> {
    if (!this.isLoaded) {
      await this.loadFrames();
    }
    return this.frames;
  }

  public async getRadarLayers(): Promise<RainViewerLayer[]> {
    const frames = await this.getRadarFrames();
    
    // Limit to last 8 past + first 4 future frames (like working radar)
    const limitedFrames = frames.slice(-12);
    
    return limitedFrames.map((frame, index) => ({
      id: `rainviewer-radar-${index}`,
      sourceId: `rainviewer-radar-source-${index}`,
      url: frame.url,
      timestamp: frame.timestamp,
      type: frame.type
    }));
  }

  private async loadFrames(): Promise<void> {
    try {
      // Get RainViewer API data
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await response.json();
      
      if (!data.radar || !data.radar.past || !data.radar.nowcast) {
        console.warn('No radar data available from RainViewer');
        this.frames = [];
        this.isLoaded = true;
        return;
      }

      const frames: RainViewerFrame[] = [];
      const baseUrl = 'https://tilecache.rainviewer.com';

      // Add past frames (RainViewer provides historical data)
      data.radar.past.forEach((frame: any) => {
        frames.push({
          url: `${baseUrl}/v2/radar/${frame.time}/256/{z}/{x}/{y}/2/1_1.png`,
          timestamp: frame.time,
          type: 'precipitation'
        });
      });

      // Add nowcast frames (RainViewer provides forecast data)
      data.radar.nowcast.forEach((frame: any) => {
        frames.push({
          url: `${baseUrl}/v2/radar/${frame.time}/256/{z}/{x}/{y}/2/1_1.png`,
          timestamp: frame.time,
          type: 'precipitation'
        });
      });

      this.frames = frames;
      this.isLoaded = true;
      
      console.log('RainViewer loaded', this.frames.length, 'radar frames');
    } catch (error) {
      console.error('Failed to load RainViewer data:', error);
      this.frames = [];
      this.isLoaded = true;
    }
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
export const rainViewerService = new RainViewerService();