import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TimePickerProps {
  value: string; // Format: "HH:MM" (24-hour format)
  onChange: (time: string) => void;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className }) => {
  // Convert 24-hour format to 12-hour format
  const to12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return { hours: hours12, minutes, period };
  };

  // Convert 12-hour format to 24-hour format
  const to24Hour = (hours12: number, minutes: number, period: string) => {
    let hours24 = hours12;
    if (period === 'AM' && hours12 === 12) {
      hours24 = 0;
    } else if (period === 'PM' && hours12 !== 12) {
      hours24 = hours12 + 12;
    }
    return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const { hours: currentHours, minutes: currentMinutes, period: currentPeriod } = to12Hour(value);

  const handleTimeChange = (hours12?: number, minutes?: number, period?: string) => {
    const newHours = hours12 !== undefined ? hours12 : currentHours;
    const newMinutes = minutes !== undefined ? minutes : currentMinutes;
    const newPeriod = period !== undefined ? period : currentPeriod;
    
    const time24 = to24Hour(newHours, newMinutes, newPeriod);
    onChange(time24);
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate minute options (00-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Hours */}
      <div className="flex-1">
        <Select value={currentHours.toString()} onValueChange={(value) => handleTimeChange(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50">
            {hourOptions.map((hour) => (
              <SelectItem key={hour} value={hour.toString()}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Minutes */}
      <div className="flex-1">
        <Select value={currentMinutes.toString().padStart(2, '0')} onValueChange={(value) => handleTimeChange(undefined, parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-48 overflow-y-auto">
            {minuteOptions.map((minute) => (
              <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                :{minute.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AM/PM */}
      <div className="flex-1">
        <Select value={currentPeriod} onValueChange={(value) => handleTimeChange(undefined, undefined, value)}>
          <SelectTrigger>
            <SelectValue placeholder="AM/PM" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-lg z-50">
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};