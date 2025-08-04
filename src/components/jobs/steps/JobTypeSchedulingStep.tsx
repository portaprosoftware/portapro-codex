import React from 'react';
import { Calendar, Clock, Package, Truck, ClipboardCheck, Crosshair, Star } from 'lucide-react';
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
    color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  },
  {
    value: 'pickup',
    label: 'Pickup',
    description: 'Pick up equipment from customer location',
    icon: Package,
    color: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
  },
  {
    value: 'service',
    label: 'Service',
    description: 'Perform maintenance or cleaning service',
    icon: ClipboardCheck,
    color: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
  },
  {
    value: 'on-site-survey',
    label: 'Survey/Estimate',
    description: 'Survey location for future service',
    icon: Crosshair,
    color: 'bg-gradient-to-r from-red-800 to-red-900 text-white',
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
      scheduled_time: enabled ? (state.data.scheduled_time || '09:00') : null
    });
  };

  const handleNotesChange = (notes: string) => {
    updateData({ notes });
  };

  const handleTogglePriority = () => {
    updateData({ is_priority: !state.data.is_priority });
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
              <div
                key={type.value}
                className={cn(
                  "p-1 rounded-xl transition-all",
                  state.data.job_type === type.value && "ring-4 ring-offset-2",
                  type.value === 'delivery' && state.data.job_type === type.value && "ring-blue-500",
                  type.value === 'pickup' && state.data.job_type === type.value && "ring-green-500",
                  type.value === 'service' && state.data.job_type === type.value && "ring-purple-500",
                  type.value === 'on-site-survey' && state.data.job_type === type.value && "ring-red-700"
                )}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
                    type.color
                  )}
                  onClick={() => handleJobTypeSelect(type.value)}
                >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1 text-white">{type.label}</h3>
                      <p className="text-sm text-white/80">{type.description}</p>
                    </div>
                  </div>
                </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
        {errors.job_type && (
          <p className="text-sm text-destructive">{errors.job_type}</p>
        )}
      </div>

      {/* Date Selection and Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Date Selection - Left side */}
        <div className="lg:col-span-2 space-y-4">
          <Label className="text-base font-medium">Scheduled Date</Label>
          <Card>
            <CardContent className="p-4 flex justify-center">
              <CalendarComponent
                mode="single"
                selected={state.data.scheduled_date ? (() => {
                  const [year, month, day] = state.data.scheduled_date.split('-').map(Number);
                  return new Date(year, month - 1, day);
                })() : undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md font-semibold text-base [&_.rdp-day]:font-semibold [&_.rdp-day]:text-base [&_.rdp-caption]:font-bold [&_.rdp-caption]:text-lg [&_.rdp-nav_button]:font-semibold [&_.rdp-weekday]:font-semibold [&_.rdp-weekday]:text-sm"
              />
            </CardContent>
          </Card>
          {errors.scheduled_date && (
            <p className="text-sm text-destructive">{errors.scheduled_date}</p>
          )}
        </div>

        {/* Right Panel - Time Toggle, Priority, and Notes */}
        <div className="lg:col-span-3 space-y-6">
          {/* Time Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={!!state.data.scheduled_time}
                  onCheckedChange={handleTimeToggle}
                />
                <Label className="text-base font-medium">Specific Time</Label>
              </div>
              <Label className="text-sm">Set time</Label>
            </div>

            {state.data.scheduled_time !== null && (
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

          {/* Priority Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={state.data.is_priority || false}
                  onCheckedChange={handleTogglePriority}
                />
                <Label className="text-base font-medium">Priority</Label>
              </div>
              <Label className="text-sm flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                Priority
              </Label>
            </div>
            {state.data.is_priority && (
              <p className="text-sm text-muted-foreground">
                This job will be highlighted for drivers.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Job Notes (Optional)</Label>
            <Textarea
              placeholder="Add special instructions..."
              value={state.data.notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
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
               {state.data.is_priority && (
                 <p>
                   <span className="font-medium">Priority:</span>{' '}
                   <span className="inline-flex items-center gap-1 text-yellow-600">
                     <Star className="w-3 h-3" />
                     High Priority
                   </span>
                 </p>
               )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}