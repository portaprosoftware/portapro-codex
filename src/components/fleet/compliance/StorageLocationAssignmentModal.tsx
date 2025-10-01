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
import { MapPin, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const handleAddLocation = (locationId: string) => {
    if (!locationAssignments.find(a => a.location_id === locationId)) {
      onUpdateAssignments([...locationAssignments, { location_id: locationId, quantity: 0 }]);
    }
  };

  const handleRemoveLocation = (locationId: string) => {
    onUpdateAssignments(locationAssignments.filter(a => a.location_id !== locationId));
  };

  const handleUpdateQuantity = (locationId: string, quantity: number) => {
    onUpdateAssignments(
      locationAssignments.map(a =>
        a.location_id === locationId ? { ...a, quantity } : a
      )
    );
  };

  const totalQuantity = locationAssignments.reduce((sum, loc) => sum + loc.quantity, 0);
  const availableLocations = storageLocations.filter(
    loc => !locationAssignments.find(a => a.location_id === loc.id)
  );

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
          {/* Available Locations */}
          {availableLocations.length > 0 && (
            <div className="space-y-2">
              <Label>Available Storage Garages</Label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {availableLocations.map(location => (
                  <Button
                    key={location.id}
                    type="button"
                    variant="outline"
                    className="justify-between h-auto py-3"
                    onClick={() => handleAddLocation(location.id)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium">{location.name}</p>
                        {location.description && (
                          <p className="text-xs text-muted-foreground">{location.description}</p>
                        )}
                      </div>
                    </div>
                    <Plus className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Locations */}
          <div className="space-y-2">
            <Label>Assigned Locations</Label>
            {locationAssignments.length > 0 ? (
              <div className="space-y-2">
                {locationAssignments.map(assignment => {
                  const location = storageLocations.find(l => l.id === assignment.location_id);
                  return (
                    <div
                      key={assignment.location_id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{location?.name}</p>
                        {location?.description && (
                          <p className="text-xs text-muted-foreground">{location.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Qty"
                          className="w-24"
                          value={assignment.quantity || ''}
                          onChange={(e) =>
                            handleUpdateQuantity(assignment.location_id, parseInt(e.target.value) || 0)
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLocation(assignment.location_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No locations assigned yet. Select locations above to begin.
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
