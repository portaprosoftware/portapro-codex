import React from 'react';
import { cn } from '@/lib/utils';

const TIMELINE_HOURS = [
  '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM'
];

// Get current time position as percentage
const getCurrentTimePosition = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Timeline starts at 6 AM (hour 6) and goes to 8 PM (hour 20)
  const timelineStart = 6;
  const timelineEnd = 20;
  const timelineHours = timelineEnd - timelineStart;
  
  if (currentHour < timelineStart || currentHour > timelineEnd) {
    return null; // Current time is outside timeline range
  }
  
  const hoursFromStart = currentHour - timelineStart;
  const minutesAsHours = currentMinutes / 60;
  const totalHoursFromStart = hoursFromStart + minutesAsHours;
  
  return (totalHoursFromStart / timelineHours) * 100;
};

export const TimelineGrid: React.FC = () => {
  return (
    <div className="border-b bg-background relative">
      <div className="flex">
        {/* Driver name column spacer */}
        <div className="w-48 border-r"></div>
        
        {/* Timeline hours */}
        <div className="flex-1 flex relative">
          {TIMELINE_HOURS.map((hour, index) => (
            <div
              key={hour}
              className={cn(
                "flex-1 min-w-0 border-r text-center py-2 text-xs font-medium",
                "bg-muted/50 text-muted-foreground"
              )}
            >
              {hour}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};