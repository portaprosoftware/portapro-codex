import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0" aria-describedby="pins-map-description">
        <div id="pins-map-description" className="sr-only">
          View and interact with GPS pins on an interactive map
        </div>
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-primary" />
            <div>
              <DialogTitle className="text-xl font-semibold">Pin Locations Map</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {pins.length} pin{pins.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Map Content */}
        <div className="flex-1 p-4">
          <div className="h-[70vh] rounded-lg overflow-hidden border">
            <MapView 
              pins={pins}
              selectedLocation={selectedLocation}
              onPinClick={onPinClick}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Click pins on the map to view details</span>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Map
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}