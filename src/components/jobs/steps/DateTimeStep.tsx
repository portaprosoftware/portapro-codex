
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateTimeStepProps {
  data: {
    date: Date | null;
    time: string;
    timezone: string;
  };
  onUpdate: (dateTime: { date: Date | null; time: string; timezone: string; }) => void;
}

const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
];

export const DateTimeStep: React.FC<DateTimeStepProps> = ({ data, onUpdate }) => {
  const handleDateSelect = (date: Date | undefined) => {
    onUpdate({
      ...data,
      date: date || null,
    });
  };

  const handleTimeSelect = (time: string) => {
    onUpdate({
      ...data,
      time,
    });
  };

  const handleTimezoneSelect = (timezone: string) => {
    onUpdate({
      ...data,
      timezone,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CalendarIcon className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Date & Time</h2>
        <p className="text-gray-600">When should this job be scheduled?</p>
      </div>

      {/* Date Selection */}
      <div className="space-y-3">
        <Label>Select Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-12",
                !data.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.date ? format(data.date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={data.date || undefined}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Selection */}
      <div className="space-y-3">
        <Label>Select Time</Label>
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <Button
              key={time}
              variant={data.time === time ? "default" : "outline"}
              size="sm"
              onClick={() => handleTimeSelect(time)}
              className={cn(
                "h-10",
                data.time === time
                  ? "bg-gradient-to-r from-[#3366FF] to-[#6699FF] hover:from-[#2952CC] hover:to-[#5580E6] text-white"
                  : "hover:border-[#3366FF] hover:text-[#3366FF]"
              )}
            >
              {time}
            </Button>
          ))}
        </div>
      </div>

      {/* Timezone Selection */}
      <div className="space-y-3">
        <Label>Timezone</Label>
        <Select value={data.timezone} onValueChange={handleTimezoneSelect}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      {data.date && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Scheduled for:
            </span>
          </div>
          <div className="text-sm text-blue-800">
            {format(data.date, "EEEE, MMMM do, yyyy")} at {data.time}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {timezones.find(tz => tz.value === data.timezone)?.label}
          </div>
        </div>
      )}
    </div>
  );
};
