import React from 'react';
import { cn } from '@/lib/utils';

// New horizontal timeline structure with 15-minute precision
export const TIME_SLOTS = [
  { id: 'no-time', label: 'No Time', startHour: null, endHour: null, flexBasis: '33%' },
  { id: '6-7', label: '6-7am', startHour: 6, endHour: 7, flexBasis: 'calc(67% / 15)' },
  { id: '7-8', label: '7-8am', startHour: 7, endHour: 8, flexBasis: 'calc(67% / 15)' },
  { id: '8-9', label: '8-9am', startHour: 8, endHour: 9, flexBasis: 'calc(67% / 15)' },
  { id: '9-10', label: '9-10am', startHour: 9, endHour: 10, flexBasis: 'calc(67% / 15)' },
  { id: '10-11', label: '10-11am', startHour: 10, endHour: 11, flexBasis: 'calc(67% / 15)' },
  { id: '11-12', label: '11am-12pm', startHour: 11, endHour: 12, flexBasis: 'calc(67% / 15)' },
  { id: '12-13', label: '12-1pm', startHour: 12, endHour: 13, flexBasis: 'calc(67% / 15)' },
  { id: '13-14', label: '1-2pm', startHour: 13, endHour: 14, flexBasis: 'calc(67% / 15)' },
  { id: '14-15', label: '2-3pm', startHour: 14, endHour: 15, flexBasis: 'calc(67% / 15)' },
  { id: '15-16', label: '3-4pm', startHour: 15, endHour: 16, flexBasis: 'calc(67% / 15)' },
  { id: '16-17', label: '4-5pm', startHour: 16, endHour: 17, flexBasis: 'calc(67% / 15)' },
  { id: '17-18', label: '5-6pm', startHour: 17, endHour: 18, flexBasis: 'calc(67% / 15)' },
  { id: '18-19', label: '6-7pm', startHour: 18, endHour: 19, flexBasis: 'calc(67% / 15)' },
  { id: '19-20', label: '7-8pm', startHour: 19, endHour: 20, flexBasis: 'calc(67% / 15)' },
  { id: 'after-20', label: 'After 8pm', startHour: 20, endHour: null, flexBasis: 'calc(67% / 15)' },
];

// Utility function to determine which time slot a job belongs to based on scheduled_time
export const getTimeSlotForJob = (scheduledTime: string | null): string => {
  if (!scheduledTime) return 'no-time';
  
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // Handle special cases
  if (timeInMinutes < 6 * 60) return 'no-time'; // Before 6am
  if (timeInMinutes >= 20 * 60) return 'after-20'; // After 8pm
  
  // Find the appropriate hourly slot
  for (let i = 1; i < TIME_SLOTS.length - 1; i++) {
    const slot = TIME_SLOTS[i];
    if (slot.startHour !== null && slot.endHour !== null) {
      const slotStart = slot.startHour * 60;
      const slotEnd = slot.endHour * 60;
      if (timeInMinutes >= slotStart && timeInMinutes < slotEnd) {
        return slot.id;
      }
    }
  }
  
  return 'no-time';
};

// Utility function to get 15-minute intervals within an hour
export const getQuarterHourIntervals = (hour: number): string[] => {
  const intervals = [];
  for (let minutes = 0; minutes < 60; minutes += 15) {
    const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    intervals.push(timeString);
  }
  return intervals;
};

// Get current time position as percentage for the new layout
export const getCurrentTimePosition = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  if (currentHour < 6 || currentHour >= 20) {
    return null; // Current time is outside main timeline range
  }
  
  // Calculate position within the 67% timeline area (excluding no-time section)
  const timeInMinutes = currentHour * 60 + currentMinutes;
  const timelineStart = 6 * 60; // 6am in minutes
  const timelineEnd = 20 * 60; // 8pm in minutes
  const timelineRange = timelineEnd - timelineStart;
  
  const position = (timeInMinutes - timelineStart) / timelineRange;
  return position * 67; // 67% of the total width (excluding 33% no-time section)
};

export const TimelineGrid: React.FC = () => {
  return (
    <div className="border-b bg-background sticky top-0 z-10">
      <div className="flex overflow-x-auto">
        {/* Driver name column spacer */}
        <div className="w-32 flex-shrink-0 border-r bg-background">
          <div className="py-3 px-2 text-center text-xs font-medium text-muted-foreground">
            Drivers
          </div>
        </div>
        
        {/* Timeline slots */}
        <div className="flex flex-1 min-w-max">
          {TIME_SLOTS.map((slot, index) => (
            <div
              key={slot.id}
              className={cn(
                "border-r text-center py-3 px-2 text-xs font-medium bg-muted/50 text-muted-foreground min-w-0",
                slot.id === 'no-time' && "bg-muted/30"
              )}
              style={{ flexBasis: slot.flexBasis, minWidth: slot.id === 'no-time' ? '200px' : '80px' }}
            >
              {slot.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};