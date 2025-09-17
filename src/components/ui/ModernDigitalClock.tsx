import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ModernDigitalClockProps {
  className?: string;
  timezone?: string;
  showSeconds?: boolean;
}

export const ModernDigitalClock: React.FC<ModernDigitalClockProps> = ({ 
  className = "",
  timezone = 'America/New_York',
  showSeconds = true
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Create time in specified timezone
      const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      setTime(timeInTimezone);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [timezone]);

  const formatString = showSeconds ? 'h:mm:ss a' : 'h:mm a';

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className="font-mono text-lg font-medium text-primary">
        {format(time, formatString)}
      </div>
    </div>
  );
};