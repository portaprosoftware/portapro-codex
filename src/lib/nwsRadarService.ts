export interface NWSRadarLayer {
  id: string;
  sourceId: string;
  url: string;
  type: 'precipitation';
}

class NWSRadarService {
  public getRadarLayer(): NWSRadarLayer {
    return {
      id: 'nws-radar',
      sourceId: 'nws-radar-source',
      url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge/n0r/{z}/{x}/{y}.png',
      type: 'precipitation'
    };
  }

  public isAvailable(): boolean {
    return true; // NWS tiles are always available
  }
}

// Export singleton instance
export const nwsRadarService = new NWSRadarService();