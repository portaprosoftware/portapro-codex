import React from 'react';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';
import { MapView } from './MapView';

interface Pin {
  id: string;
  point_name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface ServiceLocation {
  id: string;
  location_name: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  gps_coordinates?: { x: number; y: number } | null;
}

interface PinsMapSliderProps {
  isOpen: boolean;
  onClose: () => void;
  pins: Pin[];
  selectedLocation?: ServiceLocation;
  onPinClick?: (pin: Pin) => void;
}

export function PinsMapSlider({ isOpen, onClose, pins, selectedLocation, onPinClick }: PinsMapSliderProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slider */}
      <div className="fixed right-0 top-0 h-full w-full bg-background border-l shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Pin Locations Map</h2>
              <p className="text-sm text-muted-foreground">
                {pins.length} pin{pins.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Map Content */}
        <div className="flex-1 p-4">
          <div className="h-full rounded-lg overflow-hidden border">
            <MapView 
              pins={pins}
              selectedLocation={selectedLocation}
              onPinClick={onPinClick}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Click pins on the map to view details</span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Map
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}