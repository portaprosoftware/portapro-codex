import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LiveClockProps {
  className?: string;
  showAnalog?: boolean;
  showDigital?: boolean;
  showSeconds?: boolean;
  timeZone?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LiveClock: React.FC<LiveClockProps> = ({
  className,
  showAnalog = true,
  showDigital = true,
  showSeconds = true,
  timeZone = 'America/New_York',
  size = 'md'
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getLocalTime = () => {
    return new Date(time.toLocaleString("en-US", { timeZone }));
  };

  const localTime = getLocalTime();
  const hours = localTime.getHours() % 12;
  const minutes = localTime.getMinutes();
  const seconds = localTime.getSeconds();

  // Calculate angles for clock hands
  const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + minute adjustment
  const minuteAngle = minutes * 6; // 6 degrees per minute
  const secondAngle = seconds * 6; // 6 degrees per second

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const clockSize = sizeClasses[size];

  return (
    <div className="relative">
      <div 
        className="relative flex items-center justify-center"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #FFFFFF, #F6F9FF)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.10)'
        }}
      >
        {/* Clock ticks */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30) - 90;
          const isHour = i % 3 === 0;
          const length = isHour ? 8 : 4;
          const thickness = isHour ? 2 : 1;
          const radius = 40;
          
          return (
            <div
              key={i}
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                transformOrigin: '0 0',
                transform: `rotate(${angle}deg) translate(${radius - length}px, -${thickness/2}px)`,
                width: `${length}px`,
                height: `${thickness}px`,
                backgroundColor: '#64748B',
                opacity: 0.6,
              }}
            />
          );
        })}
        
        {/* Hour hand */}
        <div
          className="absolute bg-slate-700 rounded-full"
          style={{
            width: '3px',
            height: '20px',
            top: '50%',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
            transition: 'transform 0.5s ease-in-out',
            zIndex: 3,
          }}
        />
        
        {/* Minute hand */}
        <div
          className="absolute bg-slate-600 rounded-full"
          style={{
            width: '2px',
            height: '28px',
            top: '50%',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
            transition: 'transform 0.5s ease-in-out',
            zIndex: 2,
          }}
        />
        
        {/* Second hand */}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            width: '1px',
            height: '32px',
            top: '50%',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
            transition: seconds === 0 ? 'none' : 'transform 0.1s ease-out',
            zIndex: 4,
          }}
        />
        
        {/* Center dot */}
        <div
          className="absolute bg-slate-800 rounded-full"
          style={{
            width: '6px',
            height: '6px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 5,
          }}
        />
      </div>
      
      {/* Digital time overlay */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap"
        style={{ 
          background: 'linear-gradient(135deg, #2F4F9A 0%, #1E3A8A 100%)',
          fontSize: '8px'
        }}
      >
        {localTime.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: timeZone,
        })}
      </div>
    </div>
  );
};

export default LiveClock;