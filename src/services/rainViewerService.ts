interface RadarFrame {
  time: number;
  path: string;
}

interface RainViewerData {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
  satellite: {
    infrared: RadarFrame[];
  };
}

class RainViewerService {
  private readonly API_BASE = 'https://api.rainviewer.com/public/weather-maps.json';
  private readonly TILE_BASE = 'https://tilecache.rainviewer.com';
  private readonly API_TIMEOUT = 10000;

  public async getRadarData(): Promise<RainViewerData> {
    try {
      console.log('RainViewer: Requesting data from API...');
      
      const response = await fetch(this.API_BASE, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('RainViewer: API response received');
      
      return {
        version: data.version,
        generated: data.generated,
        host: data.host,
        radar: {
          past: data.radar.past || [],
          nowcast: data.radar.nowcast || []
        },
        satellite: {
          infrared: data.satellite.infrared || []
        }
      };
    } catch (error) {
      console.error('RainViewer: Error fetching radar data:', error);
      throw new Error(`Failed to fetch radar data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public getCombinedRadarFrames(data: RainViewerData) {
    const frames = [];

    // Gets last 8 past + first 4 future frames
    if (data.radar?.past) {
      data.radar.past.slice(-8).forEach(frame => {
        if (this.validateFrame(frame)) {
          frames.push({ ...frame, type: 'past' });
        }
      });
    }

    if (data.radar?.nowcast) {
      data.radar.nowcast.slice(0, 4).forEach(frame => {
        if (this.validateFrame(frame)) {
          frames.push({ ...frame, type: 'nowcast' });
        }
      });
    }

    return frames.sort((a, b) => a.time - b.time);
  }

  public generateTileUrl(frame: RadarFrame, colorScheme: number = 2): string {
    return `${this.TILE_BASE}${frame.path}/256/{z}/{x}/{y}/${colorScheme}/1_1.png`;
  }

  public async getRadarFrames(): Promise<{ path: string; time: number }[]> {
    try {
      console.log('RainViewer: Fetching radar data...');
      const data = await this.getRadarData();
      
      const combinedFrames = this.getCombinedRadarFrames(data);
      console.log('RainViewer: Got', combinedFrames.length, 'radar frames (8 past + 4 future)');
      
      return combinedFrames.map(frame => ({
        path: frame.path,
        time: frame.time
      }));
    } catch (error) {
      console.error('RainViewer: Error getting radar frames:', error);
      return [];
    }
  }

  public getTileUrl(path: string): string {
    return `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`;
  }

  private validateFrame(frame: RadarFrame): boolean {
    return frame && typeof frame.time === 'number' && typeof frame.path === 'string';
  }
}

export const rainViewerService = new RainViewerService();