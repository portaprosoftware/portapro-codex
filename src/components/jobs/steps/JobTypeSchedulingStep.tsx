import React from 'react';
import { Calendar, Clock, Package, Truck, Wrench, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TimePicker } from '@/components/ui/time-picker';
import { TimePresetButtons } from '@/components/ui/time-preset-buttons';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatDateForQuery, formatDateSafe } from '@/lib/dateUtils';

const jobTypes = [
  {
    value: 'delivery',
    label: 'Delivery',
    description: 'Deliver equipment to customer location',
    icon: Truck,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    value: 'pickup',
    label: 'Pickup',
    description: 'Pick up equipment from customer location',
    icon: Package,
    color: 'bg-green-50 border-green-200 text-green-700',
  },
  {
    value: 'service',
    label: 'Service',
    description: 'Perform maintenance or cleaning service',
    icon: Wrench,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
  },
  {
    value: 'on-site-survey',
    label: 'Site Survey',
    description: 'Survey location for future service',
    icon: Search,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
  },
] as const;

export function JobTypeSchedulingStep() {
  const { state, updateData } = useJobWizard();
  const { errors } = state;

  const handleJobTypeSelect = (jobType: string) => {
    updateData({ job_type: jobType as any });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = formatDateForQuery(date);
      console.log('Date selected:', date, 'Formatted:', formattedDate);
      updateData({ scheduled_date: formattedDate });
    }
  };

  const handleTimeChange = (time: string) => {
    updateData({ scheduled_time: time });
  };

  const handleTimeToggle = (enabled: boolean) => {
    updateData({ 
      scheduled_time: !enabled ? null : state.data.scheduled_time
    });
  };

  const handleNotesChange = (notes: string) => {
    updateData({ notes });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Job Type & Scheduling</h2>
        <p className="text-muted-foreground">
          Select the type of job and schedule when it should be performed.
        </p>
      </div>

      {/* Job Type Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Job Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.value}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  state.data.job_type === type.value 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover:bg-muted/50",
                  type.color
                )}
                onClick={() => handleJobTypeSelect(type.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/80">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{type.label}</h3>
                      <p className="text-sm opacity-80">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {errors.job_type && (
          <p className="text-sm text-destructive">{errors.job_type}</p>
        )}
      </div>

      {/* Date Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Scheduled Date</Label>
        <Card>
          <CardContent className="p-4">
            <CalendarComponent
              mode="single"
              selected={state.data.scheduled_date ? (() => {
                const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
                return new Date(year, month - 1, day);
              })() : undefined}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md"
            />
          </CardContent>
        </Card>
        {errors.scheduled_date && (
          <p className="text-sm text-destructive">{errors.scheduled_date}</p>
        )}
      </div>

      {/* Time Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Specific Time</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!state.data.scheduled_time}
              onCheckedChange={handleTimeToggle}
            />
            <Label className="text-sm">Set specific time</Label>
          </div>
        </div>

        {!!state.data.scheduled_time !== false && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <TimePresetButtons 
                onTimeSelect={handleTimeChange}
                selectedTime={state.data.scheduled_time}
              />
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <TimePicker
                  value={state.data.scheduled_time}
                  onChange={handleTimeChange}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {errors.scheduled_time && (
          <p className="text-sm text-destructive">{errors.scheduled_time}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Job Notes (Optional)</Label>
        <Textarea
          placeholder="Add any special instructions or notes for this job..."
          value={state.data.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={4}
        />
      </div>

      {/* Summary */}
      {state.data.job_type && state.data.scheduled_date && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Job Summary</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Type:</span>{' '}
                {jobTypes.find(t => t.value === state.data.job_type)?.label}
              </p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                {formatDateSafe(state.data.scheduled_date, 'long')}
              </p>
              {state.data.scheduled_time && (
                <p>
                  <span className="font-medium">Time:</span>{' '}
                  {(() => {
                    const [hours, minutes] = state.data.scheduled_time.split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                  })()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}