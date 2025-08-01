import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Clock } from 'lucide-react';
import { formatDateForQuery } from '@/lib/dateUtils';

interface SimpleDateTimeStepProps {
  data: {
    date: string;
    time: string;
  };
  onUpdate: (data: { date: string; time: string }) => void;
}

const hours = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periods = ['AM', 'PM'];

export const SimpleDateTimeStep: React.FC<SimpleDateTimeStepProps> = ({
  data,
  onUpdate
}) => {
  console.log('SimpleDateTimeStep render - data.time:', data.time);
  const [hasSpecificTime, setHasSpecificTime] = useState(!!data.time);
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [period, setPeriod] = useState('');

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Use formatDateForQuery to avoid timezone issues
      onUpdate({ ...data, date: formatDateForQuery(date) });
    }
  };

  const handleTimeToggle = (enabled: boolean) => {
    setHasSpecificTime(enabled);
    if (!enabled) {
      // Clear time when disabling
      onUpdate({ ...data, time: '' });
    }
    // Don't set any default time when enabling - wait for user to select
  };

  const updateTime = (newHour?: string, newMinute?: string, newPeriod?: string) => {
    const h = newHour || hour;
    const m = newMinute || minute;
    const p = newPeriod || period;
    
    if (newHour) setHour(newHour);
    if (newMinute) setMinute(newMinute);
    if (newPeriod) setPeriod(newPeriod);
    
    // Only set time if all three values are selected
    if (hasSpecificTime && h && m && p) {
      const timeString = `${h}:${m} ${p}`;
      onUpdate({ ...data, time: timeString });
    } else if (hasSpecificTime) {
      // Clear time if not all values are set
      onUpdate({ ...data, time: '' });
    }
  };

  const selectedDate = data.date ? new Date(data.date + 'T00:00:00') : undefined;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Date Selection */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Select Date
          </Label>
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>

        {/* Time Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Specific Time
            </Label>
            <Switch
              checked={hasSpecificTime}
              onCheckedChange={handleTimeToggle}
            />
          </div>
          
          {hasSpecificTime && (
            <div className="grid grid-cols-3 gap-2">
              <Select value={hour} onValueChange={(value) => updateTime(value, undefined, undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={minute} onValueChange={(value) => updateTime(undefined, value, undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m}>
                      :{m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={period} onValueChange={(value) => updateTime(undefined, undefined, value)}>
                <SelectTrigger>
                  <SelectValue placeholder="AM/PM" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {data.date && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">Scheduled for:</span>
              <span>
                {new Date(data.date + 'T00:00:00').toLocaleDateString()}
                {data.time && ` at ${data.time}`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};