import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, MapPin } from 'lucide-react';

interface MapModeToggleProps {
  isDriverMode: boolean;
  onModeChange: (isDriverMode: boolean) => void;
}

export const MapModeToggle: React.FC<MapModeToggleProps> = ({ 
  isDriverMode, 
  onModeChange 
}) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      <Button
        variant={!isDriverMode ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange(false)}
        className="h-8 px-3 text-sm font-medium"
      >
        <MapPin className="w-4 h-4 mr-1.5" />
        Standard Mode
      </Button>
      <Button
        variant={isDriverMode ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange(true)}
        className="h-8 px-3 text-sm font-medium"
      >
        <Users className="w-4 h-4 mr-1.5" />
        Driver Mode
      </Button>
    </div>
  );
};