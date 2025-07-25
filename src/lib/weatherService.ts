import { supabase } from "@/integrations/supabase/client";

export interface WeatherRadarFrame {
  url: string;
  timestamp: number;
  type: 'precipitation';
  opacity?: number;
}

export interface WeatherRadarLayer {
  id: string;
  sourceId: string;
  url: string;
  timestamp: number;
  type: 'precipitation';
}

class WeatherService {
  private apiKey: string | null = null;
  private frames: WeatherRadarFrame[] = [];
  private initializationPromise: Promise<void> | null = null;

  private async initializeApiKey(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-weather-token');
        
        if (error) {
          console.log('Weather service unavailable:', error);
          this.apiKey = null;
          this.frames = [];
          return;
        }

        if (data?.success && data?.weatherKey) {
          this.apiKey = data.weatherKey;
          this.frames = data.radarFrames || [];
          console.log('Weather service initialized with', this.frames.length, 'frames');
        } else {
          console.log('Weather key not found, weather features disabled');
          this.apiKey = null;
          this.frames = [];
        }
      } catch (error) {
        console.log('Weather key initialization failed:', error);
        this.apiKey = null;
        this.frames = [];
      }
    })();

    return this.initializationPromise;
  }

  public async getRadarFrames(): Promise<WeatherRadarFrame[]> {
    await this.initializeApiKey();
    
    if (!this.apiKey || !this.frames.length) {
      return [];
    }

    return this.frames.map(frame => ({
      ...frame,
      opacity: 0.7
    }));
  }

  public async getRadarLayers(): Promise<WeatherRadarLayer[]> {
    const frames = await this.getRadarFrames();
    
    return frames.map((frame, index) => ({
      id: `weather-radar-${index}`,
      sourceId: `weather-radar-source-${index}`,
      url: frame.url,
      timestamp: frame.timestamp,
      type: frame.type
    }));
  }

  public isAvailable(): boolean {
    return this.apiKey !== null;
  }

  public async refreshData(): Promise<void> {
    this.initializationPromise = null;
    await this.initializeApiKey();
  }
}

// Export singleton instance
export const weatherService = new WeatherService();