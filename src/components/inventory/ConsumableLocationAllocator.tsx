import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface LocationStock {
  locationId: string;
  locationName: string;
  onHand: number;
  reorderThreshold?: number;
}

interface ConsumableLocationAllocatorProps {
  value: LocationStock[];
  onChange: (locationStock: LocationStock[]) => void;
  disabled?: boolean;
}

export const ConsumableLocationAllocator: React.FC<ConsumableLocationAllocatorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [locations, setLocations] = useState<LocationStock[]>(value || []);
  const queryClient = useQueryClient();

  // Fetch all storage locations
  const { data: storageLocations = [] } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Update parent when locations change
  useEffect(() => {
    onChange(locations);
  }, [locations, onChange]);

  // Initialize with storage locations if empty
  useEffect(() => {
    if (locations.length === 0 && storageLocations.length > 0) {
      const initialLocations = storageLocations.map(location => ({
        locationId: location.id,
        locationName: location.name,
        onHand: 0,
        reorderThreshold: 0
      }));
      setLocations(initialLocations);
    }
  }, [storageLocations, locations.length]);

  const handleQuantityChange = (locationId: string, field: 'onHand' | 'reorderThreshold', value: number) => {
    setLocations(prev => prev.map(loc => 
      loc.locationId === locationId 
        ? { ...loc, [field]: Math.max(0, value) }
        : loc
    ));
  };

  const addLocation = () => {
    const availableLocations = storageLocations.filter(
      storage => !locations.some(loc => loc.locationId === storage.id)
    );

    if (availableLocations.length === 0) {
      toast.error('All storage locations have been added');
      return;
    }

    const newLocation = availableLocations[0];
    setLocations(prev => [...prev, {
      locationId: newLocation.id,
      locationName: newLocation.name,
      onHand: 0,
      reorderThreshold: 0
    }]);
  };

  const removeLocation = (locationId: string) => {
    setLocations(prev => prev.filter(loc => loc.locationId !== locationId));
  };

  const totalOnHand = locations.reduce((sum, loc) => sum + loc.onHand, 0);
  const canAddLocation = storageLocations.length > locations.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          Storage Location Allocation
          <Badge variant="outline" className="ml-2">
            Total: {totalOnHand}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Storage Location</TableHead>
                <TableHead className="w-32">On Hand</TableHead>
                <TableHead className="w-32">Reorder Level</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.locationId}>
                  <TableCell className="font-medium">
                    {location.locationName}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={location.onHand}
                      onChange={(e) => handleQuantityChange(
                        location.locationId, 
                        'onHand', 
                        parseInt(e.target.value) || 0
                      )}
                      disabled={disabled}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={location.reorderThreshold || 0}
                      onChange={(e) => handleQuantityChange(
                        location.locationId, 
                        'reorderThreshold', 
                        parseInt(e.target.value) || 0
                      )}
                      disabled={disabled}
                      className="w-full"
                    />
                  </TableCell>
                  <TableCell>
                    {locations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(location.locationId)}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {canAddLocation && (
          <Button
            variant="outline"
            onClick={addLocation}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Storage Location
          </Button>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-medium">Total On Hand:</span>
          <Badge variant={totalOnHand > 0 ? "default" : "secondary"} className="text-sm">
            {totalOnHand}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};