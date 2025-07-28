import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

interface AddConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationStock {
  locationId: string;
  locationName: string;
  onHand: number;
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


export const AddConsumableModal: React.FC<AddConsumableModalProps> = ({
  isOpen,
  onClose
}) => {
  const [showScannerModal, setShowScannerModal] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<ConsumableFormData>({
    defaultValues: {
      name: '',
      description: '',
      category: '',
      sku: '',
      unit_cost: '',
      unit_price: '',
      locationStock: [],
      is_active: true,
      notes: ''
    }
  });

  const createConsumable = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      console.log('Creating consumable with data:', data);
      
      // Parse and validate cost/price
      const unitCost = parseFloat(data.unit_cost);
      const unitPrice = parseFloat(data.unit_price);
      
      if (isNaN(unitCost) || isNaN(unitPrice) || unitCost < 0 || unitPrice < 0) {
        throw new Error('Please enter valid cost and price values');
      }
      
      // Calculate total on hand from location stock
      const totalOnHand = data.locationStock?.reduce((sum, loc) => sum + loc.onHand, 0) || 0;
      
      // Insert the main consumable record
      const { data: consumableData, error: consumableError } = await supabase
        .from('consumables')
        .insert([{
          name: data.name,
          description: data.description,
          category: data.category,
          sku: data.sku,
          unit_cost: unitCost,
          unit_price: unitPrice,
          on_hand_qty: totalOnHand,
          reorder_threshold: 0,
          is_active: data.is_active,
          notes: data.notes
        }])
        .select()
        .maybeSingle();
      
      if (consumableError) {
        console.error('Error creating consumable:', consumableError);
        throw consumableError;
      }

      if (!consumableData) {
        throw new Error('Failed to create consumable - no data returned');
      }

      console.log('Created consumable:', consumableData);

      // Insert location stock records if we have any
      if (data.locationStock && data.locationStock.length > 0) {
        const validLocationStockInserts = data.locationStock
          .filter(loc => loc.locationId && loc.locationId.trim() !== '')
          .map(loc => ({
            consumable_id: consumableData.id,
            storage_location_id: loc.locationId,
            quantity: loc.onHand
          }));

        if (validLocationStockInserts.length > 0) {
          console.log('Creating location stock records:', validLocationStockInserts);

          const { error: insertError } = await supabase
            .from('consumable_location_stock')
            .insert(validLocationStockInserts);
          
          if (insertError) {
            console.warn('Error creating location stock (non-fatal):', insertError);
            // Don't throw - consumable was created successfully
          }
        }
      }

      console.log('Successfully created consumable');
      return consumableData;
    },
    onSuccess: (data) => {
      console.log('Consumable creation successful:', data);
      
      // Invalidate and refetch consumables data
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      queryClient.invalidateQueries({ queryKey: ['consumable-location-stock'] });
      
      toast({
        title: 'Success',
        description: 'Consumable created successfully'
      });
      
      // Reset form to initial state
      form.reset({
        name: '',
        description: '',
        category: '',
        sku: '',
        unit_cost: '',
        unit_price: '',
        locationStock: [],
        is_active: true,
        notes: ''
      });
      
      setShowScannerModal(false);
      onClose();
    },
    onError: (error) => {
      console.error('Consumable creation failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create consumable',
        variant: 'destructive'
      });
    }
  });

  const handleScanResult = (scannedCode: string) => {
    form.setValue('sku', scannedCode);
    setShowScannerModal(false);
  };

  const onSubmit = (data: ConsumableFormData) => {
    console.log('Form submitted with data:', data);
    createConsumable.mutate(data);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Consumable</SheetTitle>
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
                          disabled={createConsumable.isPending}
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
              <Button type="submit" disabled={createConsumable.isPending}>
                {createConsumable.isPending ? 'Creating...' : 'Create Consumable'}
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