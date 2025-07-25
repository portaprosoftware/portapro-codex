import React from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind } from 'lucide-react';

interface WeatherData {
  date: string;
  temp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherForecastProps {
  location?: string;
  days?: number;
  className?: string;
}

export function WeatherForecast({ location = "Current Location", days = 5, className = "" }: WeatherForecastProps) {
  // Mock weather data - will be replaced with OpenWeather API
  const mockWeatherData: WeatherData[] = [
    { date: "Today", temp: 72, condition: "Sunny", icon: "sun", humidity: 45, windSpeed: 8 },
    { date: "Tomorrow", temp: 68, condition: "Partly Cloudy", icon: "cloud", humidity: 55, windSpeed: 12 },
    { date: "Wed", temp: 65, condition: "Light Rain", icon: "rain", humidity: 78, windSpeed: 15 },
    { date: "Thu", temp: 70, condition: "Cloudy", icon: "cloud", humidity: 60, windSpeed: 10 },
    { date: "Fri", temp: 74, condition: "Sunny", icon: "sun", humidity: 40, windSpeed: 6 },
  ];

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sun': return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'cloud': return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'rain': return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'snow': return <Snowflake className="w-8 h-8 text-blue-200" />;
      default: return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weather Forecast</h3>
        <span className="text-sm text-gray-600">{location}</span>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {mockWeatherData.slice(0, days).map((day, index) => (
          <div key={index} className="text-center p-3 rounded-lg bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-2">{day.date}</div>
            <div className="flex justify-center mb-2">
              {getWeatherIcon(day.icon)}
            </div>
            <div className="text-lg font-bold">{day.temp}°</div>
            <div className="text-xs text-gray-600 mt-1">{day.condition}</div>
            <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
              <Wind className="w-3 h-3 mr-1" />
              {day.windSpeed}mph
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}