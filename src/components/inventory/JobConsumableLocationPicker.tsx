import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus } from 'lucide-react';
import { StorageLocationSelector } from './StorageLocationSelector';

interface LocationConsumableAllocation {
  locationId: string;
  locationName: string;
  quantity: number;
  availableStock: number;
}

interface JobConsumableLocationPickerProps {
  consumableId: string;
  consumableName: string;
  totalQuantityNeeded: number;
  onAllocationChange: (allocations: LocationConsumableAllocation[]) => void;
  value?: LocationConsumableAllocation[];
}

export const JobConsumableLocationPicker: React.FC<JobConsumableLocationPickerProps> = ({
  consumableId,
  consumableName,
  totalQuantityNeeded,
  onAllocationChange,
  value = []
}) => {
  const [allocations, setAllocations] = useState<LocationConsumableAllocation[]>(value);

  // Fetch available stock at each location for this consumable
  const { data: locationStock = [] } = useQuery({
    queryKey: ['job-consumable-location-stock', consumableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumable_location_stock')
        .select(`
          storage_location_id,
          quantity,
          storage_location:storage_locations(id, name)
        `)
        .eq('consumable_id', consumableId)
        .gt('quantity', 0);
      
      if (error) throw error;
      return data.map((item: any) => ({
        locationId: item.storage_location.id,
        locationName: item.storage_location.name,
        availableStock: item.quantity
      }));
    }
  });

  // Find location with highest stock as default
  const defaultLocation = locationStock.reduce((best, current) => 
    current.availableStock > (best?.availableStock || 0) ? current : best
  , null);

  React.useEffect(() => {
    if (allocations.length === 0 && defaultLocation && totalQuantityNeeded > 0) {
      const defaultAllocation: LocationConsumableAllocation = {
        locationId: defaultLocation.locationId,
        locationName: defaultLocation.locationName,
        quantity: Math.min(totalQuantityNeeded, defaultLocation.availableStock),
        availableStock: defaultLocation.availableStock
      };
      setAllocations([defaultAllocation]);
      onAllocationChange([defaultAllocation]);
    }
  }, [defaultLocation, totalQuantityNeeded, allocations.length, onAllocationChange]);

  const updateAllocation = (index: number, quantity: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].quantity = Math.max(0, Math.min(quantity, newAllocations[index].availableStock));
    setAllocations(newAllocations);
    onAllocationChange(newAllocations);
  };

  const addLocation = (locationId: string) => {
    const location = locationStock.find(l => l.locationId === locationId);
    if (!location || allocations.some(a => a.locationId === locationId)) return;

    const remainingNeeded = totalQuantityNeeded - allocations.reduce((sum, a) => sum + a.quantity, 0);
    const newAllocation: LocationConsumableAllocation = {
      locationId: location.locationId,
      locationName: location.locationName,
      quantity: Math.min(remainingNeeded, location.availableStock),
      availableStock: location.availableStock
    };

    const newAllocations = [...allocations, newAllocation];
    setAllocations(newAllocations);
    onAllocationChange(newAllocations);
  };

  const removeLocation = (index: number) => {
    const newAllocations = allocations.filter((_, i) => i !== index);
    setAllocations(newAllocations);
    onAllocationChange(newAllocations);
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + a.quantity, 0);
  const availableLocations = locationStock.filter(l => 
    !allocations.some(a => a.locationId === l.locationId)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          {consumableName} - Location Allocation
          <div className="flex gap-2">
            <Badge variant={totalAllocated === totalQuantityNeeded ? "default" : "destructive"}>
              {totalAllocated} / {totalQuantityNeeded}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Allocations */}
        {allocations.map((allocation, index) => (
          <div key={allocation.locationId} className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium">{allocation.locationName}</div>
              <div className="text-sm text-muted-foreground">
                Available: {allocation.availableStock}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAllocation(index, allocation.quantity - 1)}
                disabled={allocation.quantity <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={allocation.quantity}
                onChange={(e) => updateAllocation(index, parseInt(e.target.value) || 0)}
                className="w-16 text-center"
                min="0"
                max={allocation.availableStock}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAllocation(index, allocation.quantity + 1)}
                disabled={allocation.quantity >= allocation.availableStock}
              >
                <Plus className="h-3 w-3" />
              </Button>
              {allocations.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLocation(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Add Location */}
        {availableLocations.length > 0 && totalAllocated < totalQuantityNeeded && (
          <div className="flex items-center gap-3 p-3 border border-dashed rounded-lg">
            <div className="flex-1">
              <Select onValueChange={addLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Add another location" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map(location => (
                    <SelectItem key={location.locationId} value={location.locationId}>
                      {location.locationName} ({location.availableStock} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="flex justify-between items-center pt-2 border-t text-sm">
          <span>Total Allocated:</span>
          <Badge variant={totalAllocated === totalQuantityNeeded ? "default" : "destructive"}>
            {totalAllocated} / {totalQuantityNeeded}
          </Badge>
        </div>

        {totalAllocated !== totalQuantityNeeded && (
          <div className="text-sm text-destructive">
            {totalAllocated < totalQuantityNeeded 
              ? `Still need ${totalQuantityNeeded - totalAllocated} more items`
              : `Over-allocated by ${totalAllocated - totalQuantityNeeded} items`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};