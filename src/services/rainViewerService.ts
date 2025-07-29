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
      const response = await fetch(RainViewerService.BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching radar data:', error);
      throw error;
    }
  }

  getTileUrl(path: string): string {
    return `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`;
  }

  async getRadarFrames(): Promise<{ path: string; time: number }[]> {
    try {
      const data = await this.getRadarData();
      
      // Combine past and nowcast frames, limited to prevent flashing
      const pastFrames = data.radar.past.slice(-6); // Last 6 past frames
      const nowcastFrames = data.radar.nowcast.slice(0, 2); // First 2 nowcast frames
      
      return [...pastFrames, ...nowcastFrames];
    } catch (error) {
      console.error('Error getting radar frames:', error);
      return [];
    }
  }
}

export const rainViewerService = new RainViewerService();