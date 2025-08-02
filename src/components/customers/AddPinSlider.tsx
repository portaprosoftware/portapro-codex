import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, MapPin, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface AddPinSliderProps {
  isOpen: boolean;
  onClose: () => void;
  serviceLocation: ServiceLocation;
  onPinAdded: () => void;
}

export function AddPinSlider({ isOpen, onClose, serviceLocation, onPinAdded }: AddPinSliderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    point_name: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.point_name || !formData.latitude || !formData.longitude) {
      toast.error('Please fill in all required fields');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid coordinates');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Please enter valid GPS coordinates');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_location_coordinates')
        .insert({
          service_location_id: serviceLocation.id,
          point_name: formData.point_name,
          description: formData.description || null,
          latitude: lat,
          longitude: lng,
        });

      if (error) throw error;

      setFormData({
        point_name: '',
        description: '',
        latitude: '',
        longitude: '',
      });
      
      onPinAdded();
      toast.success('GPS pin added successfully');
    } catch (error) {
      console.error('Error adding pin:', error);
      toast.error('Failed to add GPS pin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slider */}
      <div className="fixed right-0 top-0 h-full w-full md:w-3/4 bg-background border-l shadow-xl z-50 flex flex-col transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-background">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Add GPS Drop-Pin</h2>
              <p className="text-sm text-muted-foreground">
                Add a new GPS coordinate for {serviceLocation.location_name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="point_name">Pin Name *</Label>
              <Input
                id="point_name"
                value={formData.point_name}
                onChange={(e) => handleInputChange('point_name', e.target.value)}
                placeholder="e.g., Loading Dock, Front Entrance"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description for this location"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  placeholder="e.g., 40.7128"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  placeholder="e.g., -74.0060"
                  required
                />
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium mb-1">GPS Coordinate Tips</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Use decimal degrees format (e.g., 40.7128, -74.0060)</li>
                    <li>• You can find coordinates using Google Maps</li>
                    <li>• Latitude range: -90 to 90</li>
                    <li>• Longitude range: -180 to 180</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isSubmitting ? 'Adding...' : 'Add Pin'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}