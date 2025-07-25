export interface RainViewerFrame {
  time: number;
  path: string;
  type?: 'past' | 'nowcast';
}

export interface RainViewerResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerFrame[];
    nowcast: RainViewerFrame[];
  };
}

class RainViewerService {
  private readonly API_BASE = 'https://api.rainviewer.com/public/weather-maps.json';
  private readonly TILE_BASE = 'https://tilecache.rainviewer.com';
  private readonly API_TIMEOUT = 10000;

  public async getRadarData(): Promise<RainViewerResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

      const response = await fetch(this.API_BASE, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.radar?.past || !data.radar?.nowcast) {
        console.warn('Invalid radar data structure from RainViewer');
        return null;
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('RainViewer API request timed out');
      } else {
        console.error('Failed to fetch RainViewer data:', error);
      }
      return null;
    }
  }

  public getCombinedRadarFrames(data: RainViewerResponse): RainViewerFrame[] {
    const frames: RainViewerFrame[] = [];

    // Get last 8 past frames (90 minutes)
    if (data.radar?.past) {
      data.radar.past.slice(-8).forEach(frame => {
        if (this.validateFrame(frame)) {
          frames.push({ ...frame, type: 'past' });
        }
      });
    }

    // Get first 4 future frames (30 minutes)
    if (data.radar?.nowcast) {
      data.radar.nowcast.slice(0, 4).forEach(frame => {
        if (this.validateFrame(frame)) {
          frames.push({ ...frame, type: 'nowcast' });
        }
      });
    }

    // Sort by timestamp to ensure correct order
    return frames.sort((a, b) => a.time - b.time);
  }

  private validateFrame(frame: any): boolean {
    return frame && 
           typeof frame.time === 'number' && 
           typeof frame.path === 'string' && 
           frame.path.length > 0;
  }

  public generateTileUrl(frame: RainViewerFrame, colorScheme: number = 2): string {
    return `${this.TILE_BASE}${frame.path}/256/{z}/{x}/{y}/${colorScheme}/1_1.png`;
  }

  public formatTimestampToAMPM(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  public async refreshData(): Promise<RainViewerResponse | null> {
    return this.getRadarData();
  }
}

// Export singleton instance
export const rainViewerService = new RainViewerService();