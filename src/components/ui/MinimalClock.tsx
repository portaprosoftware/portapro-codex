import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MinimalClockProps {
  className?: string;
  timeZone?: string;
  size?: number;
}

export const MinimalClock: React.FC<MinimalClockProps> = ({
  className,
  timeZone = 'America/New_York',
  size = 120
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Create time in specified timezone
      const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone }));
      setTime(timeInTimezone);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [timeZone]);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Calculate angles for clock hands
  const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + minute adjustment
  const minuteAngle = minutes * 6; // 6 degrees per minute
  const secondAngle = seconds * 6; // 6 degrees per second

  const center = size / 2;
  const hourLength = Math.round(center * 0.5);
  const minuteLength = Math.round(center * 0.7);
  const secondLength = Math.round(center * 0.8);
  
  // Scale stroke widths based on size for better rendering
  const hourStrokeWidth = Math.max(1, Math.round(size / 40));
  const minuteStrokeWidth = Math.max(1, Math.round(size / 50));
  const markerStrokeWidth = Math.max(1, Math.round(size / 60));

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div 
        className="relative bg-white rounded-full shadow-lg border border-gray-200"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="absolute inset-0"
          viewBox={`0 0 ${size} ${size}`}
          shapeRendering="crispEdges"
        >
          {/* Hour markers */}
          {[0, 3, 6, 9].map((hour) => {
            const angle = (hour * 30) * (Math.PI / 180);
            const x1 = center + (center - 12) * Math.sin(angle);
            const y1 = center - (center - 12) * Math.cos(angle);
            const x2 = center + (center - 20) * Math.sin(angle);
            const y2 = center - (center - 20) * Math.cos(angle);
            
            return (
              <line
                key={hour}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#374151"
                strokeWidth={markerStrokeWidth}
                strokeLinecap="round"
              />
            );
          })}

          {/* Hour hand */}
          <line
            x1={center}
            y1={center}
            x2={Math.round(center + hourLength * Math.sin(hourAngle * Math.PI / 180))}
            y2={Math.round(center - hourLength * Math.cos(hourAngle * Math.PI / 180))}
            stroke="#1f2937"
            strokeWidth={hourStrokeWidth}
            strokeLinecap="round"
            style={{ 
              transition: 'all 0.5s ease-in-out',
            }}
          />

          {/* Minute hand */}
          <line
            x1={center}
            y1={center}
            x2={Math.round(center + minuteLength * Math.sin(minuteAngle * Math.PI / 180))}
            y2={Math.round(center - minuteLength * Math.cos(minuteAngle * Math.PI / 180))}
            stroke="#374151"
            strokeWidth={minuteStrokeWidth}
            strokeLinecap="round"
            style={{ 
              transition: 'all 0.5s ease-in-out',
            }}
          />

          {/* Second hand */}
          <line
            x1={center}
            y1={center}
            x2={Math.round(center + secondLength * Math.sin(secondAngle * Math.PI / 180))}
            y2={Math.round(center - secondLength * Math.cos(secondAngle * Math.PI / 180))}
            stroke="#ef4444"
            strokeWidth="1"
            strokeLinecap="round"
            style={{ 
              transition: seconds === 0 ? 'none' : 'all 0.1s ease-out',
            }}
          />

          {/* Center dot */}
          <circle
            cx={center}
            cy={center}
            r={Math.max(2, Math.round(size / 30))}
            fill="#1f2937"
          />
        </svg>
      </div>
    </div>
  );
};

export default MinimalClock;