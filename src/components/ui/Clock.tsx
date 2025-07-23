
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
    <div className="flex flex-col items-center space-y-3 font-sans">
      <div className="relative w-24 h-24">
        {/* Outer ring with gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E0E7FF] to-[#F0F9FF] shadow-lg">
          <div className="absolute inset-1 rounded-full bg-white shadow-inner">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Hour markers */}
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="10"
                  x2="50"
                  y2="18"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform={`rotate(${i * 30} 50 50)`}
                />
              ))}
              
              {/* Minute markers */}
              {[...Array(60)].map((_, i) => {
                if (i % 5 !== 0) {
                  return (
                    <line
                      key={i}
                      x1="50"
                      y1="10"
                      x2="50"
                      y2="14"
                      stroke="#94A3B8"
                      strokeWidth="1"
                      strokeLinecap="round"
                      transform={`rotate(${i * 6} 50 50)`}
                    />
                  );
                }
                return null;
              })}
              
              {/* Hour hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="30"
                stroke="#334155"
                strokeWidth="4"
                strokeLinecap="round"
                transform={`rotate(${hourAngle} 50 50)`}
                style={{ 
                  transition: 'transform 0.5s ease-in-out',
                  willChange: 'transform'
                }}
              />
              
              {/* Minute hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="20"
                stroke="#334155"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${minuteAngle} 50 50)`}
                style={{ 
                  transition: 'transform 0.5s ease-in-out',
                  willChange: 'transform'
                }}
              />
              
              {/* Second hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="15"
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform={`rotate(${secondAngle} 50 50)`}
                style={{ 
                  transition: 'transform 0.1s ease-out',
                  willChange: 'transform'
                }}
              />
              
              {/* Center dot */}
              <circle cx="50" cy="50" r="3" fill="#334155" />
              <circle cx="50" cy="50" r="1.5" fill="#EF4444" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Digital time overlay */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm border border-gray-200">
        <div className="text-xs font-semibold text-gray-900">
          {time.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
        <div className="text-xs text-gray-600 text-center">
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
