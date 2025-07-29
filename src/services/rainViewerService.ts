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
  private static readonly BASE_URL = 'https://api.rainviewer.com/public/weather-maps.json';

  async getRadarData(): Promise<RainViewerData> {
    try {
      console.log('RainViewer: Requesting data from API...');
      const response = await fetch(RainViewerService.BASE_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Ensure we don't store the request object
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('RainViewer: API response received');
      // Return only serializable data
      return {
        version: data.version,
        generated: data.generated,
        host: data.host,
        radar: {
          past: data.radar.past,
          nowcast: data.radar.nowcast
        },
        satellite: {
          infrared: data.satellite.infrared
        }
      };
    } catch (error) {
      console.error('RainViewer: Error fetching radar data:', error);
      throw new Error(`Failed to fetch radar data: ${error.message}`);
    }
  }

  getTileUrl(path: string): string {
    return `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`;
  }

  async getRadarFrames(): Promise<{ path: string; time: number }[]> {
    try {
      console.log('RainViewer: Fetching radar data...');
      const data = await this.getRadarData();
      
      // 90 minutes in the past (9 frames at 10-min intervals) + 30 minutes future (3 frames)
      const pastFrames = data.radar.past.slice(-9); // Last 9 past frames (90 minutes)
      const nowcastFrames = data.radar.nowcast.slice(0, 3); // First 3 nowcast frames (30 minutes)
      
      const allFrames = [...pastFrames, ...nowcastFrames];
      console.log('RainViewer: Got', allFrames.length, 'radar frames (90min past + 30min future)');
      
      return allFrames;
    } catch (error) {
      console.error('RainViewer: Error getting radar frames:', error);
      return [];
    }
  }
}

export const rainViewerService = new RainViewerService();