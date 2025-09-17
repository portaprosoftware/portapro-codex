import React from 'react';
import { cn } from '@/lib/utils';

// Fixed-width timeline structure for consistent horizontal scrolling
export const TIME_SLOTS = [
  { id: 'no-time', label: 'No Time', startHour: null, endHour: null, width: '800px' },
  { id: '5-6', label: '5-6am', startHour: 5, endHour: 6, width: '200px' },
  { id: '6-7', label: '6-7am', startHour: 6, endHour: 7, width: '200px' },
  { id: '7-8', label: '7-8am', startHour: 7, endHour: 8, width: '200px' },
  { id: '8-9', label: '8-9am', startHour: 8, endHour: 9, width: '200px' },
  { id: '9-10', label: '9-10am', startHour: 9, endHour: 10, width: '200px' },
  { id: '10-11', label: '10-11am', startHour: 10, endHour: 11, width: '200px' },
  { id: '11-12', label: '11am-12pm', startHour: 11, endHour: 12, width: '200px' },
  { id: '12-13', label: '12-1pm', startHour: 12, endHour: 13, width: '200px' },
  { id: '13-14', label: '1-2pm', startHour: 13, endHour: 14, width: '200px' },
  { id: '14-15', label: '2-3pm', startHour: 14, endHour: 15, width: '200px' },
  { id: '15-16', label: '3-4pm', startHour: 15, endHour: 16, width: '200px' },
  { id: '16-17', label: '4-5pm', startHour: 16, endHour: 17, width: '200px' },
  { id: '17-18', label: '5-6pm', startHour: 17, endHour: 18, width: '200px' },
  { id: '18-19', label: '6-7pm', startHour: 18, endHour: 19, width: '200px' },
  { id: '19-20', label: '7-8pm', startHour: 19, endHour: 20, width: '200px' },
  { id: '20-21', label: '8-9pm', startHour: 20, endHour: 21, width: '200px' },
  { id: '21-22', label: '9-10pm', startHour: 21, endHour: 22, width: '200px' },
  { id: 'late', label: 'Late', startHour: 22, endHour: null, width: '200px' },
];

// Utility function to determine which time slot a job belongs to based on scheduled_time
export const getTimeSlotForJob = (scheduledTime: string | null): string => {
  if (!scheduledTime) return 'no-time';
  
  try {
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    
    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('Invalid time format:', scheduledTime);
      return 'no-time';
    }
    
    const timeInMinutes = hours * 60 + minutes;
  
  // Handle special cases
  if (timeInMinutes < 5 * 60) return 'no-time'; // Before 5am
  if (timeInMinutes >= 22 * 60) return 'late'; // After 10pm
  
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
  } catch (error) {
    console.warn('Error parsing scheduled time:', scheduledTime, error);
    return 'no-time';
  }
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
    <div className="border-b bg-gradient-to-r from-blue-600 to-blue-700 sticky top-[120px] z-10">
      <div className="flex">
        {/* Timeline slots start directly after sticky column */}
        <div className="flex">
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className={cn(
                "border-r border-blue-500/30 text-center py-3 px-2 text-xs font-medium text-white flex items-center justify-center",
                slot.id === 'no-time' ? "bg-blue-700" : "bg-gradient-to-r from-blue-600 to-blue-700"
              )}
              style={{ width: slot.width, minWidth: slot.width, flexShrink: 0 }}
            >
              {slot.id === 'no-time' ? 'No Time Selected' : slot.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};