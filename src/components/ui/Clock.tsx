
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
    <div className="relative w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Hour markers - only main 4 positions */}
        {[0, 3, 6, 9].map((hour) => (
          <line
            key={hour}
            x1="50"
            y1="12"
            x2="50"
            y2="20"
            stroke="#334155"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${hour * 30} 50 50)`}
          />
        ))}
        
        {/* Hour hand */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="32"
          stroke="#334155"
          strokeWidth="2"
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
          y2="22"
          stroke="#334155"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} 50 50)`}
          style={{ 
            transition: 'transform 0.5s ease-in-out',
            willChange: 'transform'
          }}
        />
        
        {/* Center dot */}
        <circle cx="50" cy="50" r="2" fill="#334155" />
      </svg>
    </div>
  );
};
