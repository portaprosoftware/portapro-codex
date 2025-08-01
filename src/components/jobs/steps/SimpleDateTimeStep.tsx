import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Clock } from 'lucide-react';

interface SimpleDateTimeStepProps {
  data: {
    date: string;
    time: string;
  };
  onUpdate: (data: { date: string; time: string }) => void;
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];

export const SimpleDateTimeStep: React.FC<SimpleDateTimeStepProps> = ({
  data,
  onUpdate
}) => {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onUpdate({ ...data, date: date.toISOString().split('T')[0] });
    }
  };

  const handleTimeSelect = (time: string) => {
    onUpdate({ ...data, time });
  };

  const selectedDate = data.date ? new Date(data.date) : undefined;

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
          <Label className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Time
          </Label>
          <Select value={data.time} onValueChange={handleTimeSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose time slot" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      {data.date && data.time && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">Scheduled for:</span>
              <span>
                {new Date(data.date).toLocaleDateString()} at {data.time}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};