import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LocationStockItem {
  locationId: string;
  locationName: string;
  quantity: number;
}

interface SimpleLocationStockManagerProps {
  value: LocationStockItem[];
  onChange: (locationStock: LocationStockItem[]) => void;
  disabled?: boolean;
}

export const SimpleLocationStockManager: React.FC<SimpleLocationStockManagerProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  // Fetch available storage locations
  const { data: storageLocations } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const handleQuantityChange = (locationId: string, quantity: number) => {
    const updatedStock = value.map(item => 
      item.locationId === locationId 
        ? { ...item, quantity: Math.max(0, quantity) }
        : item
    );
    onChange(updatedStock);
  };

  const addLocation = (locationId: string) => {
    const location = storageLocations?.find(loc => loc.id === locationId);
    if (!location) return;

    // Check if location already exists
    if (value.some(item => item.locationId === locationId)) return;

    const newStock = [...value, {
      locationId: location.id,
      locationName: location.name,
      quantity: 0
    }];
    onChange(newStock);
  };

  const removeLocation = (locationId: string) => {
    const updatedStock = value.filter(item => item.locationId !== locationId);
    onChange(updatedStock);
  };

  const totalQuantity = value.reduce((sum, item) => sum + item.quantity, 0);

  const availableLocations = storageLocations?.filter(
    loc => !value.some(item => item.locationId === loc.id)
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Storage Locations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {value.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {value.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.locationName}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.locationId, parseInt(e.target.value) || 0)}
                      disabled={disabled}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLocation(item.locationId)}
                      disabled={disabled}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No locations assigned. Add a location to get started.
          </div>
        )}

        {availableLocations.length > 0 && (
          <div className="flex items-center gap-2">
            <Select onValueChange={addLocation} disabled={disabled}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add a storage location" />
              </SelectTrigger>
              <SelectContent>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {value.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Total Quantity:</span>
              <span>{totalQuantity}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};