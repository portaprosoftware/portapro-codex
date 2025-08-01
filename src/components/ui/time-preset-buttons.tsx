import React from 'react';
import { Button } from '@/components/ui/button';

interface TimePresetButtonsProps {
  onTimeSelect: (time: string) => void;
  selectedTime?: string | null;
}

export const TimePresetButtons: React.FC<TimePresetButtonsProps> = ({ onTimeSelect, selectedTime }) => {
  const presets = [
    { label: '8:00 AM', value: '08:00' },
    { label: '9:00 AM', value: '09:00' },
    { label: '10:00 AM', value: '10:00' },
    { label: '1:00 PM', value: '13:00' },
    { label: '2:00 PM', value: '14:00' },
    { label: '3:00 PM', value: '15:00' },
    { label: '4:00 PM', value: '16:00' },
    { label: '5:00 PM', value: '17:00' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Quick Select</p>
      <div className="grid grid-cols-4 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant={selectedTime === preset.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTimeSelect(preset.value)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
};