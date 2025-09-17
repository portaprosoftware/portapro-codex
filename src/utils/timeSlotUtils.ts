import { TIME_SLOTS } from '@/components/dispatch/TimelineGrid';

// Convert time slot ID to actual time string for scheduling
export const getTimeFromSlot = (timeSlotId: string): string | null => {
  const slot = TIME_SLOTS.find(s => s.id === timeSlotId);
  
  if (!slot || timeSlotId === 'no-time') {
    return null; // Unscheduled
  }
  
  if (timeSlotId === 'after-20') {
    return '20:00'; // 8pm
  }
  
  // For regular hourly slots, return the start hour
  if (slot.startHour !== null) {
    return `${slot.startHour.toString().padStart(2, '0')}:00`;
  }
  
  return null;
};

// Generate time options for a given time slot (15-minute intervals)
export const getTimeOptionsForSlot = (timeSlotId: string): string[] => {
  const slot = TIME_SLOTS.find(s => s.id === timeSlotId);
  
  if (!slot || timeSlotId === 'no-time' || timeSlotId === 'after-20') {
    return [];
  }
  
  if (slot.startHour === null) return [];
  
  const options = [];
  for (let minutes = 0; minutes < 60; minutes += 15) {
    const timeString = `${slot.startHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    options.push(timeString);
  }
  
  return options;
};

// Parse a custom time range (e.g., "10:15-11:15") to determine duration and slots
export const parseCustomTimeRange = (startTime: string, endTime: string) => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationMinutes = endMinutes - startMinutes;
  
  return {
    startTime,
    endTime,
    durationMinutes,
    isCustomRange: durationMinutes !== 60 || startMin !== 0 // Not a standard hour block
  };
};

// Format time for display (12-hour format)
export const formatTimeForDisplay = (time24: string): string => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Validate if a time fits within a specific slot
export const validateTimeInSlot = (time: string, slotId: string): boolean => {
  const slot = TIME_SLOTS.find(s => s.id === slotId);
  if (!slot) return false;
  
  if (slotId === 'no-time') return !time;
  if (slotId === 'after-20') return true; // After 8pm accepts any late time
  
  const [hours] = time.split(':').map(Number);
  return slot.startHour !== null && hours >= slot.startHour && hours < (slot.endHour || 24);
};