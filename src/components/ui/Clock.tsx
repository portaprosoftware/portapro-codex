
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
    <div className="relative w-20 h-20">
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
  );
};
