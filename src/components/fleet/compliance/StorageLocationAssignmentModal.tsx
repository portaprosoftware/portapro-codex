import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface StorageLocation {
  id: string;
  name: string;
  description?: string;
}

interface LocationAssignment {
  location_id: string;
  quantity: number;
}

interface StorageLocationAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageLocations: StorageLocation[];
  locationAssignments: LocationAssignment[];
  onUpdateAssignments: (assignments: LocationAssignment[]) => void;
}

export function StorageLocationAssignmentModal({
  isOpen,
  onClose,
  storageLocations,
  locationAssignments,
  onUpdateAssignments,
}: StorageLocationAssignmentModalProps) {
  const handleToggleLocation = (locationId: string, enabled: boolean) => {
    if (enabled) {
      // Add location with 0 quantity
      onUpdateAssignments([...locationAssignments, { location_id: locationId, quantity: 0 }]);
    } else {
      // Remove location
      onUpdateAssignments(locationAssignments.filter(a => a.location_id !== locationId));
    }
  };

  const handleUpdateQuantity = (locationId: string, quantity: number) => {
    onUpdateAssignments(
      locationAssignments.map(a =>
        a.location_id === locationId ? { ...a, quantity } : a
      )
    );
  };

  const isLocationEnabled = (locationId: string) => {
    return locationAssignments.some(a => a.location_id === locationId);
  };

  const getLocationQuantity = (locationId: string) => {
    const assignment = locationAssignments.find(a => a.location_id === locationId);
    return assignment?.quantity || 0;
  };

  const totalQuantity = locationAssignments.reduce((sum, loc) => sum + loc.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Storage Location Assignment</DialogTitle>
          <DialogDescription>
            Assign inventory quantities to storage garage locations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* All Storage Locations with Toggles */}
          <div className="space-y-2">
            <Label>Storage Garage Locations</Label>
            {storageLocations && storageLocations.length > 0 ? (
              <div className="space-y-2">
                {storageLocations.map(location => {
                  const enabled = isLocationEnabled(location.id);
                  const quantity = getLocationQuantity(location.id);
                  
                  return (
                    <div
                      key={location.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                        enabled ? 'bg-muted/30 border-primary/30' : 'bg-background'
                      }`}
                    >
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => handleToggleLocation(location.id, checked)}
                      />
                      <MapPin className={`h-4 w-4 flex-shrink-0 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {location.name}
                        </p>
                        {location.description && (
                          <p className="text-xs text-muted-foreground">{location.description}</p>
                        )}
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          disabled={!enabled}
                          value={enabled ? quantity : ''}
                          onChange={(e) =>
                            handleUpdateQuantity(location.id, parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No storage garage locations found. Add locations in Inventory → Storage Garages first.
                </p>
              </div>
            )}
          </div>

          {/* Total Summary */}
          {locationAssignments.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm font-medium">Total Quantity Assigned:</span>
              <Badge variant="secondary" className="text-base">
                {totalQuantity} units
              </Badge>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
