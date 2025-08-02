import React from 'react';
import { MapPin, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Pin {
  id: string;
  point_name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface PinCardProps {
  pin: Pin;
  onAssignInventory?: (pin: Pin) => void;
}

export function PinCard({ pin, onAssignInventory }: PinCardProps) {
  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${pin.latitude},${pin.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <h4 className="font-medium text-foreground truncate">
              {pin.point_name}
            </h4>
          </div>

          {pin.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {pin.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(pin.created_at), 'MMM d, yyyy')}
            </span>
            <button
              onClick={openInMaps}
              className="text-primary hover:underline"
            >
              {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
            </button>
          </div>

          {onAssignInventory && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignInventory(pin)}
                className="w-full"
              >
                <Package className="w-3 h-3 mr-1" />
                Assign Inventory
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}