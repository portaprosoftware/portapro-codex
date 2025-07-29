// Utility service to handle external API calls without DataCloneError issues
// Uses XMLHttpRequest instead of fetch to avoid Request object cloning problems

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

class ApiService {
  /**
   * Make an API request using XMLHttpRequest to avoid DataCloneError
   */
  async request<T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      
      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Set default Accept header if not provided
      if (!headers['Accept']) {
        xhr.setRequestHeader('Accept', 'application/json');
      }

      // Set Content-Type for POST/PUT requests with body
      if ((method === 'POST' || method === 'PUT') && body && !headers['Content-Type']) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = xhr.responseText ? JSON.parse(xhr.responseText) : null;
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

      xhr.ontimeout = function() {
        reject(new Error('Request timeout'));
      };

      // Set timeout to 30 seconds
      xhr.timeout = 30000;

      // Send request
      if (body) {
        xhr.send(typeof body === 'string' ? body : JSON.stringify(body));
      } else {
        xhr.send();
      }
    });
  }

  /**
   * Geocode an address using Mapbox API
   */
  async geocodeAddress(address: string, mapboxToken: string): Promise<[number, number] | null> {
    if (!mapboxToken || !address.trim()) return null;

    try {
      const encodedAddress = encodeURIComponent(address.trim());
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1&country=us`;
      
      const data = await this.request(url);
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'GET', headers });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'POST', body, headers });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'PUT', body, headers });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, { method: 'DELETE', headers });
  }
}

export const apiService = new ApiService();