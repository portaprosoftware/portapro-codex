
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string | null; // Format: "HH:MM" (24-hour format) or null
  onChange: (time: string) => void;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className }) => {
  const [inputValue, setInputValue] = useState('');
  
  // Always use custom interface for enhanced accessibility
  const useNativeInput = false;

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

  // Update input value when prop changes
  useEffect(() => {
    if (value) {
      setInputValue(value);
    }
  }, [value]);

  const handleTimeChange = (hours12?: number, minutes?: number, period?: string) => {
    const newHours = hours12 !== undefined ? hours12 : currentHours;
    const newMinutes = minutes !== undefined ? minutes : currentMinutes;
    const newPeriod = period !== undefined ? period : currentPeriod;
    
    const time24 = to24Hour(newHours, newMinutes, newPeriod);
    onChange(time24);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    setInputValue(timeValue);
    if (timeValue && timeValue.match(/^\d{2}:\d{2}$/)) {
      onChange(timeValue);
    }
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Parse various time formats
    const timeRegex = /^(\d{1,2}):?(\d{0,2})\s*(am|pm)?$/i;
    const match = input.match(timeRegex);
    
    if (match) {
      let hours = parseInt(match[1]);
      let minutes = match[2] ? parseInt(match[2]) : 0;
      let period = match[3] ? match[3].toUpperCase() : currentPeriod;
      
      // Auto-detect AM/PM based on hour if not specified
      if (!match[3] && hours >= 1 && hours <= 12) {
        period = hours >= 7 && hours <= 11 ? 'AM' : 'PM';
      }
      
      // Validate hours and minutes
      if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
        const time24 = to24Hour(hours, minutes, period);
        onChange(time24);
      }
    }
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

  if (useNativeInput) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium">Time</Label>
        <Input
          type="time"
          value={inputValue}
          onChange={handleInputChange}
          className="h-12 text-base font-medium"
          aria-label="Select time"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Manual Input Option */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Enter Time</Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="e.g. 2:30 PM or 14:30"
            onChange={handleManualInput}
            className="pl-10 h-10 text-sm"
            aria-label="Type time manually"
          />
        </div>
      </div>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or select</span>
        </div>
      </div>

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
