import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CategorySelect } from '@/components/ui/category-select';
import { BarcodeScannerModal } from '@/components/ui/barcode-scanner';
import { DesktopBarcodeInput } from '@/components/ui/desktop-barcode-input';
import { ConsumableLocationAllocator } from './ConsumableLocationAllocator';
import { toast } from '@/hooks/use-toast';

interface LocationStock {
  locationId: string;
  locationName: string;
  onHand: number;
}

interface Consumable {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  unit_cost: number;
  unit_price: number;
  on_hand_qty: number;
  reorder_threshold: number;
  is_active: boolean;
  notes?: string;
  locationStock?: LocationStock[];
}

interface EditConsumableModalProps {
  isOpen: boolean;
  consumable: Consumable | null;
  onClose: () => void;
}

interface ConsumableFormData {
  name: string;
  description?: string;
  category: string;
  sku?: string;
  unit_cost: number;
  unit_price: number;
  locationStock: LocationStock[];
  reorder_threshold: number;
  is_active: boolean;
  notes?: string;
}


export const EditConsumableModal: React.FC<EditConsumableModalProps> = ({
  isOpen,
  consumable,
  onClose
}) => {
  const [showScannerModal, setShowScannerModal] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<ConsumableFormData>();

  // Fetch existing location stock data for this consumable
  const { data: locationStockData = [] } = useQuery({
    queryKey: ['consumable-location-stock', consumable?.id],
    queryFn: async () => {
      if (!consumable?.id) return [];
      
      const { data, error } = await supabase
        .from('consumable_location_stock')
        .select(`
          *,
          storage_locations!inner (
            id,
            name
          )
        `)
        .eq('consumable_id', consumable.id);
      
      if (error) throw error;
      
      return data.map((item: any) => ({
        locationId: item.storage_location_id,
        locationName: item.storage_locations.name,
        onHand: Number(item.quantity) || 0
      }));
    },
    enabled: !!consumable?.id && isOpen
  });

  useEffect(() => {
    if (consumable) {
      const defaultLocationStock = locationStockData && locationStockData.length > 0 
        ? locationStockData 
        : [];
      
      console.log('Resetting form with data:', { 
        consumable, 
        locationStockData, 
        defaultLocationStock 
      });
      
      form.reset({
        name: consumable.name,
        description: consumable.description || '',
        category: consumable.category,
        sku: consumable.sku || '',
        unit_cost: consumable.unit_cost,
        unit_price: consumable.unit_price,
        locationStock: defaultLocationStock,
        reorder_threshold: consumable.reorder_threshold || 0,
        is_active: consumable.is_active,
        notes: consumable.notes || ''
      });
    }
  }, [consumable, locationStockData, form]);

  const updateConsumable = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      if (!consumable) return;
      
      console.log('Updating consumable with data:', data);
      
      // Calculate total on hand from location stock
      const totalOnHand = data.locationStock.reduce((sum, loc) => sum + (Number(loc.onHand) || 0), 0);
      
      // Validate that we have location stock
      if (!data.locationStock || data.locationStock.length === 0) {
        throw new Error('At least one storage location must be allocated');
      }
      
      // Update the main consumable record
      const { error: consumableError } = await supabase
        .from('consumables')
        .update({
          name: data.name,
          description: data.description,
          category: data.category,
          sku: data.sku,
          unit_cost: data.unit_cost,
          unit_price: data.unit_price,
          on_hand_qty: totalOnHand,
          reorder_threshold: data.reorder_threshold,
          is_active: data.is_active,
          notes: data.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', consumable.id);
      
      if (consumableError) {
        console.error('Error updating consumable:', consumableError);
        throw consumableError;
      }

      console.log('Updated main consumable record');

      // Delete existing location stock records
      const { error: deleteError } = await supabase
        .from('consumable_location_stock')
        .delete()
        .eq('consumable_id', consumable.id);
      
      if (deleteError) {
        console.error('Error deleting existing location stock:', deleteError);
        throw deleteError;
      }

      console.log('Deleted existing location stock records');

      // Insert new location stock records
      const locationStockInserts = data.locationStock.map(loc => ({
        consumable_id: consumable.id,
        storage_location_id: loc.locationId,
        quantity: loc.onHand
      }));

      console.log('Creating new location stock records:', locationStockInserts);

      const { error: insertError } = await supabase
        .from('consumable_location_stock')
        .insert(locationStockInserts);
      
      if (insertError) {
        console.error('Error creating new location stock:', insertError);
        throw insertError;
      }

      console.log('Successfully updated consumable and location stock');
      return consumable.id;
    },
    onSuccess: (consumableId) => {
      console.log('Consumable update successful:', consumableId);
      
      // Invalidate and refetch all relevant data
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
      queryClient.invalidateQueries({ queryKey: ['consumable-location-stock'] });
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      
      toast({
        title: 'Success',
        description: 'Consumable updated successfully'
      });
      onClose();
    },
    onError: (error) => {
      console.error('Consumable update failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update consumable',
        variant: 'destructive'
      });
    }
  });

  const handleScanResult = (scannedCode: string) => {
    form.setValue('sku', scannedCode);
    setShowScannerModal(false);
  };

  const onSubmit = (data: ConsumableFormData) => {
    console.log('Edit form submitted with data:', data);
    
    // Validate location stock
    if (!data.locationStock || data.locationStock.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please allocate stock to at least one storage location',
        variant: 'destructive'
      });
      return;
    }
    
    // Calculate total on hand from location stock
    const totalOnHand = data.locationStock.reduce((sum, loc) => sum + (Number(loc.onHand) || 0), 0);
    
    const submitData = {
      ...data,
      on_hand_qty: totalOnHand, // Set the total for the main record
      locationStock: data.locationStock
    };
    
    console.log('Submitting updated data:', submitData);
    updateConsumable.mutate(submitData);
  };

  if (!consumable) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto" aria-describedby="edit-consumable-description">
        <SheetHeader>
          <SheetTitle>Edit Consumable</SheetTitle>
          <p id="edit-consumable-description" className="sr-only">
            Edit consumable form with fields for name, category, pricing, and location allocation
          </p>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter consumable name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <CategorySelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <DesktopBarcodeInput
                        {...field}
                        placeholder="Enter SKU"
                        onScanResult={handleScanResult}
                        onCameraScan={() => setShowScannerModal(true)}
                        showTestButton={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_cost"
                rules={{ required: 'Unit cost is required', min: { value: 0, message: 'Must be positive' } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_price"
                rules={{ required: 'Unit price is required', min: { value: 0, message: 'Must be positive' } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="locationStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location Allocation</FormLabel>
                      <FormControl>
                        <ConsumableLocationAllocator
                          value={field.value || []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="reorder_threshold"
                  rules={{ required: 'Reorder threshold is required', min: { value: 0, message: 'Must be positive' } }}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Reorder Threshold *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? '' : parseInt(value) || 0);
                          }}
                          placeholder="Enter threshold amount" 
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        You'll receive a notification when total stock falls below this threshold
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center justify-center space-y-2">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter additional notes"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Information Box */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium">Global Reorder Threshold</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Reorder Threshold:</strong> You'll receive a notification when total stock across all locations falls below this amount</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateConsumable.isPending}>
                {updateConsumable.isPending ? 'Updating...' : 'Update Consumable'}
              </Button>
            </div>
          </form>
        </Form>

        <BarcodeScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onScanResult={handleScanResult}
        />
      </SheetContent>
    </Sheet>
  );
};