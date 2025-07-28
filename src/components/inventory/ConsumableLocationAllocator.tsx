import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface LocationStock {
  locationId: string;
  locationName: string;
  onHand: number;
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
  const [locations, setLocations] = useState<LocationStock[]>([]);
  const [selectedLocationToAdd, setSelectedLocationToAdd] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
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

  // Initialize component state properly
  useEffect(() => {
    if (!isInitialized && storageLocations.length > 0) {
      if (value && value.length > 0) {
        // If parent provides initial data, use it
        console.log('ConsumableLocationAllocator: Using provided value:', value);
        setLocations(value);
      } else {
        // If parent has empty array, start with empty state (user can add locations manually)
        console.log('ConsumableLocationAllocator: Starting with empty state');
        setLocations([]);
      }
      setIsInitialized(true);
    }
  }, [value, storageLocations, isInitialized]);

  // Sync changes back to parent (only after initialization)
  useEffect(() => {
    if (isInitialized && locations.length > 0) {
      const currentValueString = JSON.stringify(value || []);
      const locationsString = JSON.stringify(locations);
      
      if (currentValueString !== locationsString) {
        console.log('ConsumableLocationAllocator: Syncing changes to parent:', locations);
        onChange(locations);
      }
    }
  }, [locations, onChange, value, isInitialized]);

  const handleQuantityChange = (locationId: string, value: number) => {
    const newLocations = locations.map(loc => 
      loc.locationId === locationId 
        ? { ...loc, onHand: Math.max(0, Number(value) || 0) }
        : loc
    );
    
    console.log('ConsumableLocationAllocator: Quantity changed:', { locationId, value, newLocations });
    setLocations(newLocations);
  };

  const addSelectedLocation = () => {
    if (!selectedLocationToAdd) {
      toast.error('Please select a storage location');
      return;
    }

    const selectedLocation = storageLocations.find(loc => loc.id === selectedLocationToAdd);
    if (!selectedLocation) {
      toast.error('Selected location not found');
      return;
    }

    const newLocation = {
      locationId: selectedLocation.id,
      locationName: selectedLocation.name,
      onHand: 0
    };
    
    const newLocations = [...locations, newLocation];
    console.log('ConsumableLocationAllocator: Adding location:', newLocation);
    setLocations(newLocations);
    setSelectedLocationToAdd('');
  };

  const removeLocation = (locationId: string) => {
    const newLocations = locations.filter(loc => loc.locationId !== locationId);
    console.log('ConsumableLocationAllocator: Removing location:', locationId);
    setLocations(newLocations);
  };

  const totalOnHand = locations.reduce((sum, loc) => sum + (Number(loc.onHand) || 0), 0);
  const availableLocations = storageLocations.filter(
    storage => !locations.some(loc => loc.locationId === storage.id)
  );
  const canAddLocation = availableLocations.length > 0;

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
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location, index) => (
                <TableRow key={`${location.locationId}-${index}`}>
                  <TableCell className="font-medium">
                    {location.locationName}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={location.onHand || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleQuantityChange(
                          location.locationId, 
                          value === '' ? 0 : Number(value) || 0
                        );
                      }}
                      disabled={disabled}
                      className="w-full"
                      placeholder="0"
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
          <div className="flex gap-2">
            <Select value={selectedLocationToAdd} onValueChange={setSelectedLocationToAdd}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select storage location to add" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={selectedLocationToAdd ? "default" : "outline"}
              onClick={addSelectedLocation}
              disabled={disabled || !selectedLocationToAdd}
              className={selectedLocationToAdd ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
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