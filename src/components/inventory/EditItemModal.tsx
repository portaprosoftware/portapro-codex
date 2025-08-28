import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { VendorSelector } from '@/components/inventory/VendorSelector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditItemModalProps {
  itemId: string;
  isOpen?: boolean;
  onClose: () => void;
}

interface ProductItem {
  id: string;
  product_id: string;
  barcode: string;
  status: string;
  condition: string;
  location: string;
  current_storage_location_id: string | null;
  color: string;
  size: string;
  material: string;
  notes: string;
  maintenance_reason: string;
  expected_return_date: string | null;
  maintenance_notes: string;
  tool_number: string;
  vendor_id: string | null;
  plastic_code: string;
  manufacturing_date: string | null;
  mold_cavity: string;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  itemId,
  isOpen = true,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<ProductItem>>({});
  const [originalData, setOriginalData] = useState<Partial<ProductItem>>({});

  const { data: item, isLoading } = useQuery({
    queryKey: ['product-item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_items')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      return data as ProductItem;
    },
    enabled: !!itemId,
  });

  const { data: storageLocations } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (item) {
      const itemData = {
        status: item.status || '',
        condition: item.condition || '',
        location: item.location || '',
        current_storage_location_id: item.current_storage_location_id || '',
        color: item.color || '',
        size: item.size || '',
        material: item.material || '',
        notes: item.notes || '',
        maintenance_reason: item.maintenance_reason || '',
        expected_return_date: item.expected_return_date || null,
        maintenance_notes: item.maintenance_notes || '',
        tool_number: item.tool_number || '',
        vendor_id: item.vendor_id || '',
        plastic_code: item.plastic_code || '',
        manufacturing_date: item.manufacturing_date || null,
        mold_cavity: item.mold_cavity || '',
      };
      setFormData(itemData);
      setOriginalData(itemData);
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: async (updateData: Partial<ProductItem>) => {
      console.log('EditItemModal mutation starting with data:', updateData);
      
      // Normalize the payload - convert empty strings to null for UUID/date fields
      const normalizedData = {
        ...updateData,
        vendor_id: updateData.vendor_id === '' ? null : updateData.vendor_id,
        current_storage_location_id: updateData.current_storage_location_id === '' ? null : updateData.current_storage_location_id,
        expected_return_date: updateData.expected_return_date === '' ? null : updateData.expected_return_date,
        manufacturing_date: updateData.manufacturing_date === '' ? null : updateData.manufacturing_date,
      };

      console.log('Sending update data:', updateData);
      console.log('Sending safe update data:', normalizedData);

      // Log location transfer if applicable
      if (originalData.current_storage_location_id !== normalizedData.current_storage_location_id &&
          originalData.current_storage_location_id && 
          normalizedData.current_storage_location_id) {
        try {
          const { error: transferError } = await supabase
            .from('product_item_location_transfers')
            .insert({
              product_id: item.product_id,
              product_item_id: itemId,
              from_location_id: originalData.current_storage_location_id,
              to_location_id: normalizedData.current_storage_location_id,
              transferred_by: 'system', // TODO: Get actual user
              notes: `Status changed to ${normalizedData.status}`,
            });

          if (transferError) {
            console.log('Failed to create transfer record:', transferError);
          }
        } catch (transferError) {
          console.log('Failed to create transfer record:', transferError);
        }
      }

      // Update the item - removed .select().single() to avoid casting issues
      const { error } = await supabase
        .from('product_items')
        .update(normalizedData)
        .eq('id', itemId);

      if (error) throw error;
      
      return normalizedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['product-items'] });
      toast.success('Item updated successfully');
      onClose();
    },
    onError: (error) => {
      console.log('Update error details:', error);
      toast.error('Failed to update item');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('EditItemModal handleSubmit:', formData);
    
    // Auto-set condition to "needs_repair" when status is "maintenance"
    const finalFormData = {
      ...formData,
      condition: formData.status === 'maintenance' ? 'needs_repair' : formData.condition,
    };
    
    updateMutation.mutate(finalFormData);
  };

  const handleInputChange = (field: keyof ProductItem, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: keyof ProductItem, date: Date | undefined) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: date ? format(date, 'yyyy-MM-dd') : null 
    }));
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Unit - {item.barcode}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status and Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || ''}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition || ''}
                onValueChange={(value) => handleInputChange('condition', value)}
                disabled={formData.status === 'maintenance'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="needs_repair">Needs Repair</SelectItem>
                </SelectContent>
              </Select>
              {formData.status === 'maintenance' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically set to "Needs Repair" for maintenance items
                </p>
              )}
            </div>
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location (Text)</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Warehouse A, Section 2"
              />
            </div>

            <div>
              <Label htmlFor="storage_location">Storage Location</Label>
              <Select
                value={formData.current_storage_location_id || ''}
                onValueChange={(value) => handleInputChange('current_storage_location_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select storage location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No storage location</SelectItem>
                  {storageLocations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Physical Properties */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color || ''}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="Blue, Green, etc."
              />
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={formData.size || ''}
                onChange={(e) => handleInputChange('size', e.target.value)}
                placeholder="Small, Medium, Large"
              />
            </div>

            <div>
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={formData.material || ''}
                onChange={(e) => handleInputChange('material', e.target.value)}
                placeholder="Plastic, Metal, etc."
              />
            </div>
          </div>

          {/* Manufacturing Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tool_number">Tool Number</Label>
              <Input
                id="tool_number"
                value={formData.tool_number || ''}
                onChange={(e) => handleInputChange('tool_number', e.target.value)}
                placeholder="Tool/Mold identifier"
              />
            </div>

            <div>
              <Label htmlFor="plastic_code">Plastic Code</Label>
              <Input
                id="plastic_code"
                value={formData.plastic_code || ''}
                onChange={(e) => handleInputChange('plastic_code', e.target.value)}
                placeholder="Plastic type code"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="manufacturing_date">Manufacturing Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.manufacturing_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.manufacturing_date ? (
                      format(new Date(formData.manufacturing_date), "PP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.manufacturing_date ? new Date(formData.manufacturing_date) : undefined}
                    onSelect={(date) => handleDateChange('manufacturing_date', date)}
                    initialFocus
                  />
                  {formData.manufacturing_date && (
                    <div className="p-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDateChange('manufacturing_date', undefined)}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="mold_cavity">Mold Cavity</Label>
              <Input
                id="mold_cavity"
                value={formData.mold_cavity || ''}
                onChange={(e) => handleInputChange('mold_cavity', e.target.value)}
                placeholder="Cavity number"
              />
            </div>

            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <VendorSelector
                value={formData.vendor_id || ''}
                onValueChange={(value) => handleInputChange('vendor_id', value)}
              />
            </div>
          </div>

          {/* Maintenance Fields */}
          {formData.status === 'maintenance' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium">Maintenance Information</h3>
              
              <div>
                <Label htmlFor="maintenance_reason">Maintenance Reason</Label>
                <Input
                  id="maintenance_reason"
                  value={formData.maintenance_reason || ''}
                  onChange={(e) => handleInputChange('maintenance_reason', e.target.value)}
                  placeholder="Reason for maintenance"
                />
              </div>

              <div>
                <Label htmlFor="expected_return_date">Expected Return Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expected_return_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expected_return_date ? (
                        format(new Date(formData.expected_return_date), "PP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.expected_return_date ? new Date(formData.expected_return_date) : undefined}
                      onSelect={(date) => handleDateChange('expected_return_date', date)}
                      initialFocus
                    />
                    {formData.expected_return_date && (
                      <div className="p-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDateChange('expected_return_date', undefined)}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="maintenance_notes">Maintenance Notes</Label>
                <Textarea
                  id="maintenance_notes"
                  value={formData.maintenance_notes || ''}
                  onChange={(e) => handleInputChange('maintenance_notes', e.target.value)}
                  placeholder="Additional maintenance notes"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* General Notes */}
          <div>
            <Label htmlFor="notes">General Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this unit"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
