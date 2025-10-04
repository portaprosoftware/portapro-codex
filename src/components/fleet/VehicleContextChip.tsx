import React from 'react';
import { X, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface VehicleContextChipProps {
  vehicleId: string;
  vehicleName: string;
  onClear?: () => void;
  returnTo?: string;
}

export function VehicleContextChip({ vehicleId, vehicleName, onClear, returnTo }: VehicleContextChipProps) {
  const navigate = useNavigate();

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      // Default: clear query param by navigating to current path without params
      navigate(window.location.pathname);
    }
  };

  const handleBackToProfile = () => {
    if (returnTo) {
      navigate(`${returnTo}?vehicle=${vehicleId}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="secondary" 
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-50 border-blue-200 hover:bg-blue-100"
      >
        <Truck className="w-4 h-4 text-blue-600" />
        <span className="text-blue-900">
          Viewing: <span className="font-bold">{vehicleName}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 rounded-full"
          onClick={handleClear}
        >
          <X className="w-3 h-3 text-blue-600" />
        </Button>
      </Badge>
      
      {returnTo && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToProfile}
          className="gap-2"
        >
          <Truck className="w-4 h-4" />
          Back to Vehicle Profile
        </Button>
      )}
    </div>
  );
}
