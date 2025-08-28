import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StorageLocationSelector } from './StorageLocationSelector';
import { VendorSelector } from './VendorSelector';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface EditItemModalProps {
  isOpen: boolean;
  itemId: string | null;
  onClose: () => void;
}

interface ItemFormData {
  status: string;
  condition: string;
  location: string;
  current_storage_location_id: string;
  color?: string;
  size?: string;
  material?: string;
  notes?: string;
  maintenance_reason?: string;
  expected_return_date?: string;
  maintenance_notes?: string;
  tool_number?: string;
  vendor_id?: string;
  plastic_code?: string;
  manufacturing_date?: string;
  mold_cavity?: string;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  itemId,
  onClose
}) => {
  const queryClient = useQueryClient();
  const form = useForm<ItemFormData>();
  const [previousLocationId, setPreviousLocationId] = useState<string | null>(null);

  // Fetch item data
  const { data: item, isLoading } = useQuery({
    queryKey: ['product-item', itemId],
    queryFn: async () => {
      if (!itemId) return null;
      
      const { data, error } = await supabase
        .from('product_items')
        .select(`
          *,
          products!inner(id, name),
          storage_locations(id, name),
          vendors(id, name)
        `)
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!itemId && isOpen
  });

  // Reset form when item data changes
  useEffect(() => {
    if (item) {
      setPreviousLocationId(item.current_storage_location_id);
      
      form.reset({
        status: item.status || 'available',
        condition: item.condition || 'good',
        location: item.location || '',
        current_storage_location_id: item.current_storage_location_id || '',
        color: item.color || '',
        size: item.size || '',
        material: item.material || '',
        notes: item.notes || '',
        maintenance_reason: item.maintenance_reason || '',
        expected_return_date: item.expected_return_date || '',
        maintenance_notes: item.maintenance_notes || '',
        tool_number: item.tool_number || '',
        vendor_id: item.vendor_id || '',
        plastic_code: item.plastic_code || '',
        manufacturing_date: item.manufacturing_date || '',
        mold_cavity: item.mold_cavity || ''
      });
    }
  }, [item, form]);

  const updateItem = useMutation({
    mutationFn: async (formData: ItemFormData) => {
      if (!itemId || !item) return;

      console.log('Starting item update with form data:', formData);

      // Build update data object
      const updateData: Partial<ItemFormData> = {
        status: formData.status,
        condition: formData.condition,
        location: formData.location,
        current_storage_location_id: formData.current_storage_location_id,
        color: formData.color,
        size: formData.size,
        material: formData.material,
        notes: formData.notes,
        maintenance_reason: formData.maintenance_reason,
        expected_return_date: formData.expected_return_date,
        maintenance_notes: formData.maintenance_notes,
        tool_number: formData.tool_number,
        vendor_id: formData.vendor_id,
        plastic_code: formData.plastic_code,
        manufacturing_date: formData.manufacturing_date,
        mold_cavity: formData.mold_cavity
      };

      // Ensure "needs_repair" when status is maintenance
      if (updateData.status === 'maintenance') {
        updateData.condition = 'needs_repair';
      }

      // Helper to convert empty strings to null for certain fields
      const toNullIfEmpty = (v: any) => (v === '' || v === undefined ? null : v);

      // Normalize payload to avoid 400s on UUID/date columns
      const safeUpdateData = {
        status: updateData.status,
        condition: updateData.condition,
        location: updateData.location,
        current_storage_location_id: toNullIfEmpty(updateData.current_storage_location_id),
        color: updateData.color,
        size: updateData.size,
        material: updateData.material,
        notes: updateData.notes,
        maintenance_reason: updateData.maintenance_reason,
        expected_return_date: toNullIfEmpty(updateData.expected_return_date),
        maintenance_notes: updateData.maintenance_notes,
        tool_number: updateData.tool_number,
        vendor_id: toNullIfEmpty(updateData.vendor_id),
        plastic_code: updateData.plastic_code,
        manufacturing_date: toNullIfEmpty(updateData.manufacturing_date),
        mold_cavity: updateData.mold_cavity,
      };

      // Remove undefined keys so we don't send them unnecessarily
      Object.keys(safeUpdateData).forEach((k) => {
        if (safeUpdateData[k as keyof typeof safeUpdateData] === undefined) {
          delete (safeUpdateData as any)[k];
        }
      });

      console.log('Sending safe update data:', JSON.stringify(safeUpdateData, null, 2));

      // Perform product_items update
      const { error: updateError } = await supabase
        .from("product_items")
        .update(safeUpdateData)
        .eq("id", itemId);

      if (updateError) throw updateError;

      console.log('✅ product_items updated');

      // If location changed, log the transfer
      if (
        typeof previousLocationId === 'string' &&
        previousLocationId &&
        typeof safeUpdateData.current_storage_location_id === 'string' &&
        safeUpdateData.current_storage_location_id &&
        previousLocationId !== safeUpdateData.current_storage_location_id
      ) {
        console.log('Attempting to log location transfer:', {
          from: previousLocationId,
          to: safeUpdateData.current_storage_location_id,
        });

        const { error: transferError } = await supabase
          .from('product_item_location_transfers')
          .insert({
            product_item_id: itemId,
            product_id: item.product_id,
            from_location_id: previousLocationId,
            to_location_id: safeUpdateData.current_storage_location_id,
            notes: 'Location changed via unit edit modal',
          });

        if (transferError) {
          console.warn('Failed to create transfer record:', transferError);
          // Do not throw; main update already succeeded
        } else {
          console.log('✅ Transfer record created');
        }
      } else {
        console.log('Skipping transfer log (no change or invalid locations)', {
          previousLocationId,
          newLocationId: safeUpdateData.current_storage_location_id,
        });
      }

      return itemId;
    },
    onSuccess: () => {
      toast.success('Item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['product-items'] });
      queryClient.invalidateQueries({ queryKey: ['individual-units'] });
      queryClient.invalidateQueries({ queryKey: ['product-item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['individual-units-count'] });
      queryClient.invalidateQueries({ queryKey: ['product-individual-location-stock'] });
      queryClient.invalidateQueries({ queryKey: ['product-location-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['available-individual-units-by-location'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Error updating item:', error);
      toast.error(error.message || 'Failed to update item');
    }
  });

  const onSubmit = (data: ItemFormData) => {
    updateItem.mutate(data);
  };

  const watchedStatus = form.watch('status');

  if (!item && !isLoading) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Item</SheetTitle>
          {item && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {item.products?.name} - {item.item_code}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">{item.status}</Badge>
                <Badge variant="outline">{item.condition}</Badge>
              </div>
            </div>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="needs_repair">Needs Repair</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Shelf A, Bin 3" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_storage_location_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location</FormLabel>
                      <FormControl>
                        <StorageLocationSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select storage location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter size" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter material" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tool_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tool Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter tool number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <FormControl>
                        <VendorSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select vendor"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plastic_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plastic Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter plastic code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturing_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturing Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mold_cavity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mold Cavity</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter mold cavity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedStatus === 'maintenance' && (
                <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
                  <h3 className="font-medium text-yellow-800">Maintenance Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="maintenance_reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance Reason</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Why is this item in maintenance?" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expected_return_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Return Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maintenance_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maintenance Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Additional maintenance details" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Additional notes" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateItem.isPending}>
                  {updateItem.isPending ? 'Updating...' : 'Update Item'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
};
