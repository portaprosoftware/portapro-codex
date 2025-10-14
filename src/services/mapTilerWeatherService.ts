class MapTilerWeatherService {
  private apiKey: string = '';
  
  // Set API key from edge function
  public setApiKey(key: string) {
    this.apiKey = key.trim();
  }
  
  // Get API key
  public getApiKey(): string {
    return this.apiKey;
  }
}

export const mapTilerWeatherService = new MapTilerWeatherService();
