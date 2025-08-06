
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string | null; // Format: "HH:MM" (24-hour format) or null
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

  const { hours: currentHours, minutes: currentMinutes, period: currentPeriod } = value ? to12Hour(value) : { hours: 9, minutes: 0, period: 'AM' };

  const handleTimeChange = (hours12?: number, minutes?: number, period?: string) => {
    const newHours = hours12 !== undefined ? hours12 : currentHours;
    const newMinutes = minutes !== undefined ? minutes : currentMinutes;
    const newPeriod = period !== undefined ? period : currentPeriod;
    
    const time24 = to24Hour(newHours, newMinutes, newPeriod);
    onChange(time24);
  };

  const adjustTime = (component: 'hours' | 'minutes', direction: 'up' | 'down') => {
    let newHours = currentHours;
    let newMinutes = currentMinutes;
    let newPeriod = currentPeriod;

    if (component === 'hours') {
      if (direction === 'up') {
        newHours = newHours === 12 ? 1 : newHours + 1;
      } else {
        newHours = newHours === 1 ? 12 : newHours - 1;
      }
    } else {
      if (direction === 'up') {
        newMinutes = newMinutes === 45 ? 0 : newMinutes + 15;
      } else {
        newMinutes = newMinutes === 0 ? 45 : newMinutes - 15;
      }
    }

    handleTimeChange(newHours, newMinutes, newPeriod);
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate minute options (15-minute intervals)
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className={cn("space-y-2", className)}>
      {/* Enhanced Dropdowns with +/- Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {/* Hours */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Hour</Label>
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-6 p-0"
              onClick={() => adjustTime('hours', 'up')}
              aria-label="Increase hour"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Select 
              value={currentHours.toString()} 
              onValueChange={(value) => handleTimeChange(parseInt(value))}
            >
              <SelectTrigger className="h-10 text-center font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-xl z-[9999]">
                {hourOptions.map((hour) => (
                  <SelectItem 
                    key={hour} 
                    value={hour.toString()}
                    className="cursor-pointer hover:bg-accent focus:bg-accent text-center justify-center"
                  >
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-6 p-0"
              onClick={() => adjustTime('hours', 'down')}
              aria-label="Decrease hour"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Minutes */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Min</Label>
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-6 p-0"
              onClick={() => adjustTime('minutes', 'up')}
              aria-label="Increase minutes"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Select 
              value={currentMinutes.toString().padStart(2, '0')} 
              onValueChange={(value) => handleTimeChange(undefined, parseInt(value))}
            >
              <SelectTrigger className="h-10 text-center font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-xl z-[9999]">
                {minuteOptions.map((minute) => (
                  <SelectItem 
                    key={minute} 
                    value={minute.toString().padStart(2, '0')}
                    className="cursor-pointer hover:bg-accent focus:bg-accent text-center justify-center"
                  >
                    :{minute.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-6 p-0"
              onClick={() => adjustTime('minutes', 'down')}
              aria-label="Decrease minutes"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* AM/PM */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Period</Label>
          <div className="space-y-1">
            <div className="h-6" />
            <Select 
              value={currentPeriod} 
              onValueChange={(value) => handleTimeChange(undefined, undefined, value)}
            >
              <SelectTrigger className="h-10 text-center font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-xl z-[9999]">
                <SelectItem 
                  value="AM"
                  className="cursor-pointer hover:bg-accent focus:bg-accent text-center justify-center"
                >
                  AM
                </SelectItem>
                <SelectItem 
                  value="PM"
                  className="cursor-pointer hover:bg-accent focus:bg-accent text-center justify-center"
                >
                  PM
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="h-6" />
          </div>
        </div>
      </div>

      {/* Current Time Display */}
      <div className="text-center p-2 bg-muted rounded-md">
        <span className="text-sm font-medium">
          Selected: {currentHours}:{currentMinutes.toString().padStart(2, '0')} {currentPeriod}
        </span>
      </div>
    </div>
  );
};
