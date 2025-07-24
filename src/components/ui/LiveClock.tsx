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
    <div className={cn("flex items-center gap-4", className)}>
      {/* Analog Clock */}
      {showAnalog && (
        <div className={cn(
          "relative rounded-full bg-white border-4 border-gradient-primary shadow-lg",
          clockSize
        )}>
          {/* Clock Face */}
          <div className="absolute inset-0 rounded-full">
            {/* Hour markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-3 bg-gray-600"
                style={{
                  top: '4px',
                  left: '50%',
                  transformOrigin: '50% 100%',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                }}
              />
            ))}
            
            {/* Hour Hand */}
            <div
              className="absolute w-1 bg-gray-800 rounded-full shadow-sm"
              style={{
                height: size === 'sm' ? '20px' : size === 'md' ? '28px' : '36px',
                top: size === 'sm' ? '12px' : size === 'md' ? '20px' : '28px',
                left: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) rotate(${hourAngle}deg)`,
                transition: 'transform 0.5s ease-in-out',
              }}
            />
            
            {/* Minute Hand */}
            <div
              className="absolute w-0.5 bg-gray-700 rounded-full shadow-sm"
              style={{
                height: size === 'sm' ? '26px' : size === 'md' ? '36px' : '48px',
                top: size === 'sm' ? '6px' : size === 'md' ? '12px' : '16px',
                left: '50%',
                transformOrigin: '50% 100%',
                transform: `translateX(-50%) rotate(${minuteAngle}deg)`,
                transition: 'transform 0.5s ease-in-out',
              }}
            />
            
            {/* Second Hand */}
            {showSeconds && (
              <div
                className="absolute w-px bg-red-500 rounded-full"
                style={{
                  height: size === 'sm' ? '28px' : size === 'md' ? '40px' : '52px',
                  top: size === 'sm' ? '4px' : size === 'md' ? '8px' : '12px',
                  left: '50%',
                  transformOrigin: '50% 90%',
                  transform: `translateX(-50%) rotate(${secondAngle}deg)`,
                  transition: seconds === 0 ? 'none' : 'transform 0.1s ease-out',
                }}
              />
            )}
            
            {/* Center dot */}
            <div 
              className="absolute bg-gray-800 rounded-full"
              style={{
                width: size === 'sm' ? '4px' : size === 'md' ? '6px' : '8px',
                height: size === 'sm' ? '4px' : size === 'md' ? '6px' : '8px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        </div>
      )}

      {/* Digital Clock */}
      {showDigital && (
        <div className="text-center">
          <div className={cn(
            "font-mono font-bold text-gray-800",
            size === 'sm' && "text-lg",
            size === 'md' && "text-2xl",
            size === 'lg' && "text-3xl"
          )}>
            {localTime.toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit',
              ...(showSeconds && { second: '2-digit' })
            })}
          </div>
          <div className={cn(
            "text-gray-500 font-medium",
            size === 'sm' && "text-xs",
            size === 'md' && "text-sm",
            size === 'lg' && "text-base"
          )}>
            {localTime.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClock;