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
      const response = await fetch(RainViewerService.BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('RainViewer: API response received');
      return data;
    } catch (error) {
      console.error('RainViewer: Error fetching radar data:', error);
      throw error;
    }
  }

  getTileUrl(path: string): string {
    return `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`;
  }

  async getRadarFrames(): Promise<{ path: string; time: number }[]> {
    try {
      console.log('RainViewer: Fetching radar data...');
      const data = await this.getRadarData();
      
      // Combine past and nowcast frames, limited to prevent flashing
      const pastFrames = data.radar.past.slice(-4); // Last 4 past frames
      const nowcastFrames = data.radar.nowcast.slice(0, 2); // First 2 nowcast frames
      
      const allFrames = [...pastFrames, ...nowcastFrames];
      console.log('RainViewer: Got', allFrames.length, 'radar frames');
      
      return allFrames;
    } catch (error) {
      console.error('RainViewer: Error getting radar frames:', error);
      return [];
    }
  }
}

export const rainViewerService = new RainViewerService();