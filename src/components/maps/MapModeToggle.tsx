import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, MapPin, CalendarCheck } from 'lucide-react';

interface MapModeToggleProps {
  mode: 'standard' | 'driver' | 'today';
  onModeChange: (mode: 'standard' | 'driver' | 'today') => void;
}

export const MapModeToggle: React.FC<MapModeToggleProps> = ({ 
  mode, 
  onModeChange 
}) => {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-0.5 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={mode === 'standard' ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange('standard')}
          className="h-8 px-3 text-sm font-medium whitespace-nowrap"
        >
          <MapPin className="w-4 h-4 mr-1.5" />
          Standard
        </Button>
        <Button
          variant={mode === 'driver' ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange('driver')}
          className="h-8 px-3 text-sm font-medium whitespace-nowrap"
        >
          <Users className="w-4 h-4 mr-1.5" />
          Driver
        </Button>
        <Button
          variant={mode === 'today' ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange('today')}
          className="h-8 px-3 text-sm font-medium whitespace-nowrap"
        >
          <CalendarCheck className="w-4 h-4 mr-1.5" />
          Today
        </Button>
      </div>
    </div>
  );
};