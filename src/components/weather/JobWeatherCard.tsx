import React from 'react';
import { Cloud, Sun, CloudRain, AlertTriangle, Thermometer, Wind, Droplets } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface JobWeatherCardProps {
  jobDate: string;
  jobType: 'delivery' | 'pickup' | 'service' | 'maintenance';
  className?: string;
}

export function JobWeatherCard({ jobDate, jobType, className = "" }: JobWeatherCardProps) {
  // Mock weather data - will be replaced with OpenWeather API call
  const mockWeather = {
    temp: 72,
    condition: "Partly Cloudy",
    icon: "cloud",
    humidity: 65,
    windSpeed: 12,
    precipitation: 20,
    alerts: [] as string[]
  };

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sun': return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'cloud': return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rain': return <CloudRain className="w-6 h-6 text-blue-500" />;
      default: return <Sun className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getJobTypeRecommendation = () => {
    const { precipitation, windSpeed } = mockWeather;
    
    if (precipitation > 50 || windSpeed > 20) {
      return {
        level: 'warning',
        message: 'Weather may impact outdoor work'
      };
    } else if (precipitation > 20 || windSpeed > 15) {
      return {
        level: 'caution',
        message: 'Monitor weather conditions'
      };
    }
    return {
      level: 'good',
      message: 'Good conditions for outdoor work'
    };
  };

  const recommendation = getJobTypeRecommendation();

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Weather Conditions</h4>
        <Badge 
          variant={recommendation.level === 'warning' ? 'destructive' : 
                  recommendation.level === 'caution' ? 'outline' : 'secondary'}
        >
          {recommendation.level === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
          {recommendation.message}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          {getWeatherIcon(mockWeather.icon)}
          <div>
            <div className="text-2xl font-bold">{mockWeather.temp}°F</div>
            <div className="text-sm text-gray-600">{mockWeather.condition}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Wind className="w-4 h-4 mr-2 text-gray-500" />
            <span>{mockWeather.windSpeed} mph wind</span>
          </div>
          <div className="flex items-center text-sm">
            <Droplets className="w-4 h-4 mr-2 text-gray-500" />
            <span>{mockWeather.precipitation}% chance rain</span>
          </div>
          <div className="flex items-center text-sm">
            <Thermometer className="w-4 h-4 mr-2 text-gray-500" />
            <span>{mockWeather.humidity}% humidity</span>
          </div>
        </div>
      </div>

      {mockWeather.alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center text-amber-600">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Weather Alerts</span>
          </div>
          {mockWeather.alerts.map((alert, index) => (
            <div key={index} className="text-sm text-amber-700 mt-1">{alert}</div>
          ))}
        </div>
      )}
    </div>
  );
}