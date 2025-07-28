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
  unit_cost: string;
  unit_price: string;
  locationStock: LocationStock[];
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

  // Fetch existing location stock data for this consumable using simplified query
  const locationStockQuery = useQuery({
    queryKey: ['consumable-location-stock', consumable?.id],
    queryFn: async () => {
      if (!consumable?.id) return [];
      
      console.log('📍 Fetching location stock for consumable:', consumable.id);
      
      // Use LEFT JOIN to ensure we get storage location data even if stock is 0
      const { data, error } = await supabase
        .from('consumable_location_stock')
        .select(`
          quantity,
          storage_locations!inner(id, name)
        `)
        .eq('consumable_id', consumable.id)
        .order('quantity', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching location stock:', error);
        throw error;
      }
      
      console.log('📦 Raw location stock data:', data);
      
      const locationStock = (data || []).map((item: any) => ({
        locationId: item.storage_locations?.id,
        locationName: item.storage_locations?.name,
        onHand: Number(item.quantity) || 0
      })).filter(item => item.locationId && item.locationName);
      
      console.log('✅ Transformed location stock ready for form:', locationStock);
      return locationStock;
    },
    enabled: !!consumable?.id && isOpen
  });

  const locationStockData = locationStockQuery.data || [];

  // Only reset form when we have all the data we need
  useEffect(() => {
    if (consumable && locationStockQuery.isSuccess && locationStockData !== undefined) {
      console.log('🔄 Form initialization started');
      console.log('📋 Consumable data:', {
        id: consumable.id,
        name: consumable.name,
        category: consumable.category,
        unit_cost: consumable.unit_cost,
        unit_price: consumable.unit_price,
        is_active: consumable.is_active
      });
      console.log('📍 Location stock ready:', locationStockData);
      
      const formData = {
        name: consumable.name,
        description: consumable.description || '',
        category: consumable.category,
        sku: consumable.sku || '',
        unit_cost: consumable.unit_cost?.toString() || '',
        unit_price: consumable.unit_price?.toString() || '',
        locationStock: [...locationStockData], // Create new array to avoid reference issues
        is_active: consumable.is_active,
        notes: consumable.notes || ''
      };
      
      console.log('✅ Resetting form with complete data:', formData);
      form.reset(formData);
    }
  }, [consumable, locationStockQuery.isSuccess, locationStockData]);

  const updateConsumable = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      if (!consumable) return;
      
      console.log('💾 Starting consumable update with data:', {
        name: data.name,
        category: data.category,
        locationStockCount: data.locationStock?.length || 0,
        locationStock: data.locationStock
      });
      
      // Parse and validate cost/price
      const unitCost = parseFloat(data.unit_cost);
      const unitPrice = parseFloat(data.unit_price);
      
      if (isNaN(unitCost) || isNaN(unitPrice) || unitCost < 0 || unitPrice < 0) {
        throw new Error('Please enter valid cost and price values');
      }
      
      // Calculate total on hand from location stock - ensure we preserve actual quantities
      const totalOnHand = data.locationStock?.reduce((sum, loc) => {
        const quantity = Number(loc.onHand) || 0;
        console.log(`📊 Location ${loc.locationName}: ${quantity}`);
        return sum + quantity;
      }, 0) || 0;
      
      console.log(`📈 Calculated total on hand: ${totalOnHand}`);
      
      // Use a transaction-like approach to ensure data consistency
      try {
        // Update the main consumable record
        const { error: consumableError } = await supabase
          .from('consumables')
          .update({
            name: data.name,
            description: data.description,
            category: data.category,
            sku: data.sku,
            unit_cost: unitCost,
            unit_price: unitPrice,
            on_hand_qty: totalOnHand,
            reorder_threshold: 0,
            is_active: data.is_active,
            notes: data.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', consumable.id);
        
        if (consumableError) {
          console.error('❌ Error updating consumable:', consumableError);
          throw consumableError;
        }

        console.log('✅ Updated main consumable record');

        // Delete existing location stock records
        const { error: deleteError } = await supabase
          .from('consumable_location_stock')
          .delete()
          .eq('consumable_id', consumable.id);
        
        if (deleteError) {
          console.warn('⚠️ Error deleting existing location stock:', deleteError);
          // Continue anyway - this might not be fatal
        }

        console.log('🗑️ Deleted existing location stock records');

        // Insert new location stock records if we have any
        if (data.locationStock && data.locationStock.length > 0) {
          const validLocationStockInserts = data.locationStock
            .filter(loc => loc.locationId && loc.locationId.trim() !== '' && loc.onHand > 0)
            .map(loc => ({
              consumable_id: consumable.id,
              storage_location_id: loc.locationId,
              quantity: Number(loc.onHand) || 0
            }));

          if (validLocationStockInserts.length > 0) {
            console.log('📍 Creating new location stock records:', validLocationStockInserts);

            const { error: insertError } = await supabase
              .from('consumable_location_stock')
              .insert(validLocationStockInserts);
            
            if (insertError) {
              console.error('❌ Error creating location stock:', insertError);
              throw insertError; // Make this fatal - we need location data to be correct
            }
            
            console.log('✅ Successfully created location stock records');
          }
        }

        console.log('🎉 Successfully updated consumable with all location data');
        return consumable.id;
      } catch (error) {
        console.error('💥 Transaction failed, rolling back...', error);
        throw error;
      }
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
    updateConsumable.mutate(data);
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
                rules={{ required: 'Unit cost is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...field} 
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
                rules={{ required: 'Unit price is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...field} 
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
                      <FormLabel>Storage Location Allocation (Optional)</FormLabel>
                      <FormControl>
                        <ConsumableLocationAllocator
                          value={field.value || []}
                          onChange={field.onChange}
                          disabled={updateConsumable.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                    </div>
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


            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={
                  updateConsumable.isPending || 
                  locationStockQuery.isLoading ||
                  !form.formState.isValid
                }
              >
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