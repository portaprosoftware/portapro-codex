import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PinCard } from './PinCard';
import { Trash2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Pin {
  id: string;
  point_name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface PinsListProps {
  pins: Pin[];
  isLoading: boolean;
  onPinDeleted: () => void;
  onAssignInventory?: (pin: Pin) => void;
}

export function PinsList({ pins, isLoading, onPinDeleted, onAssignInventory }: PinsListProps) {
  const [selectedPins, setSelectedPins] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPins(new Set(pins.map(pin => pin.id)));
    } else {
      setSelectedPins(new Set());
    }
  };

  const handleSelectPin = (pinId: string, checked: boolean) => {
    const newSelected = new Set(selectedPins);
    if (checked) {
      newSelected.add(pinId);
    } else {
      newSelected.delete(pinId);
    }
    setSelectedPins(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedPins.size === 0) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('service_location_coordinates')
        .delete()
        .in('id', Array.from(selectedPins));

      if (error) throw error;

      setSelectedPins(new Set());
      onPinDeleted();
      toast.success(`Deleted ${selectedPins.size} pin(s)`);
    } catch (error) {
      console.error('Error deleting pins:', error);
      toast.error('Failed to delete pins');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground mb-2">No GPS pins added yet</p>
        <p className="text-sm text-muted-foreground">
          Click "Add Drop-Pin" to create your first GPS coordinate
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedPins.size === pins.length && pins.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedPins.size > 0 
              ? `${selectedPins.size} of ${pins.length} selected`
              : `${pins.length} pin(s)`
            }
          </span>
        </div>

        {selectedPins.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : `Delete (${selectedPins.size})`}
          </Button>
        )}
      </div>

      {/* Pins list */}
      <div className="max-h-96 overflow-y-auto space-y-3 px-3">
        {pins.map((pin) => (
          <div key={pin.id} className="flex items-start gap-3">
            <Checkbox
              checked={selectedPins.has(pin.id)}
              onCheckedChange={(checked) => handleSelectPin(pin.id, checked as boolean)}
              className="mt-3 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <PinCard pin={pin} onAssignInventory={onAssignInventory} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}