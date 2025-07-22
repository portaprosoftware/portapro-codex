
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Search } from 'lucide-react';

interface LocationStepProps {
  data: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    } | null;
    specialInstructions: string;
  };
  onUpdate: (location: {
    address: string;
    coordinates: { lat: number; lng: number; } | null;
    specialInstructions: string;
  }) => void;
}

export const LocationStep: React.FC<LocationStepProps> = ({ data, onUpdate }) => {
  const handleAddressChange = (address: string) => {
    onUpdate({
      ...data,
      address,
    });
  };

  const handleInstructionsChange = (specialInstructions: string) => {
    onUpdate({
      ...data,
      specialInstructions,
    });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onUpdate({
            ...data,
            coordinates: { lat: latitude, lng: longitude },
          });
          // TODO: Reverse geocode to get address
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Job Location</h2>
        <p className="text-gray-600">Where should the team go for this job?</p>
      </div>

      {/* Address Search */}
      <div className="space-y-3">
        <Label htmlFor="address">Service Address</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="address"
            placeholder="Enter service address..."
            value={data.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {/* Get Current Location */}
      <Button
        variant="outline"
        onClick={handleGetCurrentLocation}
        className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-[#3366FF] hover:bg-blue-50"
      >
        <Navigation className="w-4 h-4 mr-2" />
        Use Current Location
      </Button>

      {/* Coordinates Display */}
      {data.coordinates && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              GPS Coordinates Set
            </span>
          </div>
          <div className="text-xs text-green-700">
            Lat: {data.coordinates.lat.toFixed(6)}, 
            Lng: {data.coordinates.lng.toFixed(6)}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      <div className="space-y-3">
        <Label htmlFor="instructions">Special Instructions</Label>
        <Textarea
          id="instructions"
          placeholder="Any special instructions for the driver? (gate codes, access notes, etc.)"
          value={data.specialInstructions}
          onChange={(e) => handleInstructionsChange(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Address Preview */}
      {data.address && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Service Location:
            </span>
          </div>
          <div className="text-sm text-blue-800">
            {data.address}
          </div>
          {data.specialInstructions && (
            <div className="text-xs text-blue-600 mt-2">
              <strong>Instructions:</strong> {data.specialInstructions}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
