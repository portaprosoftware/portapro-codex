import { supabase } from "@/integrations/supabase/client";

export interface WeatherRadarLayer {
  id: string;
  sourceId: string;
  url: string;
  timestamp: number;
  type: 'precipitation';
}

class WeatherService {
  private apiKey: string | null = null;
  private currentLayer: WeatherRadarLayer | null = null;
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
          this.currentLayer = null;
          return;
        }

        if (data?.success && data?.weatherKey && data?.currentLayer) {
          this.apiKey = data.weatherKey;
          this.currentLayer = data.currentLayer;
          console.log('Weather service initialized with current layer');
        } else {
          console.log('Weather key not found, weather features disabled');
          this.apiKey = null;
          this.currentLayer = null;
        }
      } catch (error) {
        console.log('Weather key initialization failed:', error);
        this.apiKey = null;
        this.currentLayer = null;
      }
    })();

    return this.initializationPromise;
  }

  public async getCurrentLayer(): Promise<WeatherRadarLayer | null> {
    await this.initializeApiKey();
    
    if (!this.apiKey || !this.currentLayer) {
      return null;
    }

    return this.currentLayer;
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