import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Package, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatTimezoneLabel } from '@/lib/timezoneUtils';

interface ScheduleData {
  jobType: 'delivery' | 'pickup' | 'service' | 'on-site-survey';
  timezone: string;
  deliveryDate: Date | null;
  deliveryTime: string;
  addDeliveryTime: boolean;
  returnScheduleEnabled: boolean;
  fullPickupDate: Date | null;
  fullPickupTime: string;
  addFullPickupTime: boolean;
  partialPickupsEnabled: boolean;
  partialPickups: Array<{
    id: string;
    date: Date | null;
    time: string;
    addTime: boolean;
    label: string;
    quantity?: number;
    notes?: string;
  }>;
  serviceDate: Date | null;
  serviceTime: string;
  addServiceTime: boolean;
}

interface DeliveryPickupScheduleStepProps {
  data: ScheduleData;
  onUpdate: (data: ScheduleData) => void;
}

const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export const DeliveryPickupScheduleStep: React.FC<DeliveryPickupScheduleStepProps> = ({ 
  data, 
  onUpdate 
}) => {
  const addPartialPickup = () => {
    const newPartialPickup = {
      id: crypto.randomUUID(),
      date: null,
      time: '14:00',
      addTime: false,
      label: `Partial Pickup #${data.partialPickups.length + 1}`,
      quantity: 1,
      notes: ''
    };

    onUpdate({
      ...data,
      partialPickups: [...data.partialPickups, newPartialPickup]
    });
  };

  const removePartialPickup = (id: string) => {
    onUpdate({
      ...data,
      partialPickups: data.partialPickups.filter(pickup => pickup.id !== id)
    });
  };

  const updatePartialPickup = (id: string, field: string, value: any) => {
    onUpdate({
      ...data,
      partialPickups: data.partialPickups.map(pickup =>
        pickup.id === id ? { ...pickup, [field]: value } : pickup
      )
    });
  };

  const generateSummary = () => {
    const parts: string[] = [];
    const tzLabel = formatTimezoneLabel(data.timezone);

    if (data.jobType === 'delivery') {
      if (data.deliveryDate) {
        const dateStr = format(data.deliveryDate, "MMMM do, yyyy");
        const timeStr = data.addDeliveryTime ? ` at ${data.deliveryTime}` : '';
        parts.push(`Delivery: ${dateStr}${timeStr}`);
      }

      // Partial pickups
      data.partialPickups.forEach(pickup => {
        if (pickup.date) {
          const dateStr = format(pickup.date, "MMMM do, yyyy");
          const timeStr = pickup.addTime ? ` at ${pickup.time}` : '';
          parts.push(`${pickup.label}: ${dateStr}${timeStr}`);
        }
      });

      // Full pickup
      if (data.returnScheduleEnabled && data.fullPickupDate) {
        const dateStr = format(data.fullPickupDate, "MMMM do, yyyy");
        const timeStr = data.addFullPickupTime ? ` at ${data.fullPickupTime}` : '';
        parts.push(`Full Pickup: ${dateStr}${timeStr}`);
      }
    } else if (data.jobType === 'pickup') {
      if (data.fullPickupDate) {
        const dateStr = format(data.fullPickupDate, "MMMM do, yyyy");
        const timeStr = data.addFullPickupTime ? ` at ${data.fullPickupTime}` : '';
        parts.push(`Pickup: ${dateStr}${timeStr}`);
      }
    } else if (data.jobType === 'service' || data.jobType === 'on-site-survey') {
      if (data.serviceDate) {
        const dateStr = format(data.serviceDate, "MMMM do, yyyy");
        const timeStr = data.addServiceTime ? ` at ${data.serviceTime}` : '';
        const label = data.jobType === 'service' ? 'Service' : 'On-Site Survey/Estimate';
        parts.push(`${label}: ${dateStr}${timeStr}`);
      }
    }

    if (parts.length > 0) {
      return `${parts.join(' — ')} (${tzLabel})`;
    }
    
    return null;
  };

  const DateTimePicker = ({ 
    date, 
    onDateChange, 
    time, 
    onTimeChange, 
    addTime, 
    onAddTimeChange, 
    label,
    required = false
  }: {
    date: Date | null;
    onDateChange: (date: Date | undefined) => void;
    time: string;
    onTimeChange: (time: string) => void;  
    addTime: boolean;
    onAddTimeChange: (addTime: boolean) => void;
    label: string;
    required?: boolean;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="font-medium">{label}</Label>
        {!required && (
          <div className="flex items-center space-x-2">
            <Label htmlFor={`${label}-time`} className="text-sm text-muted-foreground">
              Add time
            </Label>
            <Switch
              id={`${label}-time`}
              checked={addTime}
              onCheckedChange={onAddTimeChange}
            />
          </div>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-12",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={onDateChange}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {(addTime || required) && (
        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((timeSlot) => (
            <Button
              key={timeSlot}
              variant={time === timeSlot ? "default" : "outline"}
              size="sm"
              onClick={() => onTimeChange(timeSlot)}
              className={cn(
                "h-9 text-xs",
                time === timeSlot
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "hover:border-primary hover:text-primary"
              )}
            >
              {timeSlot}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CalendarIcon className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          {data.jobType === 'delivery' ? 'Delivery & Pickup Schedule' :
           data.jobType === 'pickup' ? 'Pickup Schedule' :
           data.jobType === 'service' ? 'Service Schedule' :
           'Survey/Estimate Schedule'}
        </h2>
        <p className="text-muted-foreground">
          Set the dates and times for your {data.jobType} job
        </p>
      </div>

      {/* Delivery Job Scheduling */}
      {data.jobType === 'delivery' && (
        <div className="space-y-6">
          {/* Delivery Date/Time */}
          <DateTimePicker
            date={data.deliveryDate}
            onDateChange={(date) => onUpdate({ ...data, deliveryDate: date || null })}
            time={data.deliveryTime}
            onTimeChange={(time) => onUpdate({ ...data, deliveryTime: time })}
            addTime={data.addDeliveryTime}
            onAddTimeChange={(addTime) => onUpdate({ ...data, addDeliveryTime: addTime })}
            label="Delivery Date"
          />

          {/* Return Schedule Toggle */}
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="font-medium">Return Schedule</Label>
                <p className="text-sm text-muted-foreground">
                  Schedule when equipment should be picked up
                </p>
              </div>
              <Switch
                checked={data.returnScheduleEnabled}
                onCheckedChange={(enabled) => onUpdate({ 
                  ...data, 
                  returnScheduleEnabled: enabled,
                  partialPickupsEnabled: enabled ? data.partialPickupsEnabled : false
                })}
              />
            </div>

            {data.returnScheduleEnabled && (
              <div className="space-y-4">
                {/* Partial Pickup Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="font-medium">Partial Pickups</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable multiple pickup dates with different quantities
                    </p>
                  </div>
                  <Switch
                    checked={data.partialPickupsEnabled}
                    onCheckedChange={(enabled) => onUpdate({ 
                      ...data, 
                      partialPickupsEnabled: enabled,
                      partialPickups: enabled ? data.partialPickups : []
                    })}
                  />
                </div>

                {/* Partial Pickups */}
                {data.partialPickupsEnabled && (
                  <div className="space-y-4">
                    {data.partialPickups.map((pickup) => (
                      <div key={pickup.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {pickup.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePartialPickup(pickup.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <DateTimePicker
                            date={pickup.date}
                            onDateChange={(date) => updatePartialPickup(pickup.id, 'date', date || null)}
                            time={pickup.time}
                            onTimeChange={(time) => updatePartialPickup(pickup.id, 'time', time)}
                            addTime={pickup.addTime}
                            onAddTimeChange={(addTime) => updatePartialPickup(pickup.id, 'addTime', addTime)}
                            label="Pickup Date"
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Quantity to Remove</Label>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updatePartialPickup(pickup.id, 'quantity', Math.max(1, (pickup.quantity || 1) - 1))}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={pickup.quantity || 1}
                                  onChange={(e) => updatePartialPickup(pickup.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-16 text-center"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updatePartialPickup(pickup.id, 'quantity', (pickup.quantity || 1) + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Special Instructions</Label>
                              <Textarea
                                placeholder="e.g., after 2 PM, call first..."
                                value={pickup.notes || ''}
                                onChange={(e) => updatePartialPickup(pickup.id, 'notes', e.target.value)}
                                className="min-h-[60px] resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={addPartialPickup}
                      className="w-full border-dashed border-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Partial Pickup #{data.partialPickups.length + 1}
                    </Button>
                  </div>
                )}

                {/* Full Pickup */}
                <DateTimePicker
                  date={data.fullPickupDate}
                  onDateChange={(date) => onUpdate({ ...data, fullPickupDate: date || null })}
                  time={data.fullPickupTime}
                  onTimeChange={(time) => onUpdate({ ...data, fullPickupTime: time })}
                  addTime={data.addFullPickupTime}
                  onAddTimeChange={(addTime) => onUpdate({ ...data, addFullPickupTime: addTime })}
                  label={data.partialPickupsEnabled ? "Final Full Pickup" : "Full Pickup"}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pickup Only Job Scheduling */}
      {data.jobType === 'pickup' && (
        <DateTimePicker
          date={data.fullPickupDate}
          onDateChange={(date) => onUpdate({ ...data, fullPickupDate: date || null })}
          time={data.fullPickupTime}
          onTimeChange={(time) => onUpdate({ ...data, fullPickupTime: time })}
          addTime={data.addFullPickupTime}
          onAddTimeChange={(addTime) => onUpdate({ ...data, addFullPickupTime: addTime })}
          label="Pickup Date"
          required
        />
      )}

      {/* Service/Survey Job Scheduling */}
      {(data.jobType === 'service' || data.jobType === 'on-site-survey') && (
        <DateTimePicker
          date={data.serviceDate}
          onDateChange={(date) => onUpdate({ ...data, serviceDate: date || null })}
          time={data.serviceTime}
          onTimeChange={(time) => onUpdate({ ...data, serviceTime: time })}
          addTime={data.addServiceTime}
          onAddTimeChange={(addTime) => onUpdate({ ...data, addServiceTime: addTime })}
          label={data.jobType === 'service' ? 'Service Date' : 'Survey/Estimate Date'}
          required
        />
      )}


      {/* Schedule Summary */}
      {generateSummary() && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Schedule Summary
            </span>
          </div>
          <div className="text-sm text-foreground leading-relaxed">
            {generateSummary()}
          </div>
        </div>
      )}
    </div>
  );
};