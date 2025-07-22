
import React, { useState, useEffect } from 'react';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const secondAngle = (time.getSeconds() * 6) - 90;
  const minuteAngle = (time.getMinutes() * 6) + (time.getSeconds() * 0.1) - 90;
  const hourAngle = ((time.getHours() % 12) * 30) + (time.getMinutes() * 0.5) - 90;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Clock face */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="8"
              x2="50"
              y2="15"
              stroke="#374151"
              strokeWidth="2"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          
          {/* Hour hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="25"
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${hourAngle} 50 50)`}
          />
          
          {/* Minute hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${minuteAngle} 50 50)`}
          />
          
          {/* Second hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="12"
            stroke="#ef4444"
            strokeWidth="1"
            strokeLinecap="round"
            transform={`rotate(${secondAngle} 50 50)`}
          />
          
          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="#374151" />
        </svg>
      </div>
      
      <div className="text-center">
        <div className="text-sm font-medium text-gray-900">
          {time.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
        <div className="text-sm text-gray-600">
          {time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>
      </div>
    </div>
  );
};
