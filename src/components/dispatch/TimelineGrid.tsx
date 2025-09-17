import React from 'react';
import { cn } from '@/lib/utils';

const TIMELINE_HOURS = [
  'Before 8am', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', 'After 5pm'
];

// Get current time position as percentage
const getCurrentTimePosition = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Timeline now spans from 6 AM (before 8am) to 8 PM (after 5pm)
  const timelineStart = 6;
  const timelineEnd = 20;
  const timelineHours = timelineEnd - timelineStart;
  
  if (currentHour < timelineStart || currentHour > timelineEnd) {
    return null; // Current time is outside timeline range
  }
  
  const hoursFromStart = currentHour - timelineStart;
  const minutesAsHours = currentMinutes / 60;
  const totalHoursFromStart = hoursFromStart + minutesAsHours;
  
  // Adjust for the new column layout
  // Before 8am (6-8) = first column, 8am-4pm = columns 2-9, After 5pm (5-8) = last column
  let adjustedPosition;
  if (currentHour < 8) {
    // Before 8am column (represents 6-8am, so position within first column)
    adjustedPosition = (totalHoursFromStart / 2) * (1 / TIMELINE_HOURS.length);
  } else if (currentHour >= 17) {
    // After 5pm column (last column)
    const lastColumnStart = (TIMELINE_HOURS.length - 1) / TIMELINE_HOURS.length;
    const positionInLastColumn = ((currentHour - 17) + minutesAsHours) / 3; // 3 hours in after 5pm
    adjustedPosition = lastColumnStart + (positionInLastColumn * (1 / TIMELINE_HOURS.length));
  } else {
    // Regular hourly columns (8am-4pm)
    const columnIndex = currentHour - 7; // 8am = column 1, 9am = column 2, etc.
    adjustedPosition = columnIndex / TIMELINE_HOURS.length + (minutesAsHours / 60) * (1 / TIMELINE_HOURS.length);
  }
  
  return adjustedPosition * 100;
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