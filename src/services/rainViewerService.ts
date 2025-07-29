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
      
      // Use XMLHttpRequest to avoid Request object cloning issues
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', RainViewerService.BASE_URL, true);
        xhr.setRequestHeader('Accept', 'application/json');
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              reject(new Error('Failed to parse JSON response'));
            }
          } else {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error occurred'));
        };
        
        xhr.send();
      });
      
      console.log('RainViewer: API response received');
      
      // Return only serializable data
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