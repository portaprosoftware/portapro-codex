import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
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
  reorderThreshold?: number;
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


export const AddConsumableModal: React.FC<AddConsumableModalProps> = ({
  isOpen,
  onClose
}) => {
  const [showScannerModal, setShowScannerModal] = useState(false);
  const form = useForm<ConsumableFormData>({
    defaultValues: {
      name: '',
      description: '',
      category: '',
      sku: '',
      unit_cost: 0,
      unit_price: 0,
      locationStock: [],
      reorder_threshold: 0,
      is_active: true,
      notes: ''
    }
  });

  const createConsumable = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      // Calculate total on hand from location stock
      const totalOnHand = data.locationStock.reduce((sum, loc) => sum + loc.onHand, 0);
      
      // Insert the main consumable record
      const { data: consumableData, error: consumableError } = await supabase
        .from('consumables')
        .insert([{
          name: data.name,
          description: data.description,
          category: data.category,
          sku: data.sku,
          unit_cost: data.unit_cost,
          unit_price: data.unit_price,
          on_hand_qty: totalOnHand,
          reorder_threshold: data.reorder_threshold,
          is_active: data.is_active,
          notes: data.notes
        }])
        .select()
        .single();
      
      if (consumableError) throw consumableError;

      // Insert location stock records if any
      if (data.locationStock.length > 0) {
        const locationStockInserts = data.locationStock.map(loc => ({
          consumable_id: consumableData.id,
          storage_location_id: loc.locationId,
          quantity: loc.onHand,
          reorder_threshold: loc.reorderThreshold || 0
        }));

        const { error: insertError } = await supabase
          .from('consumable_location_stock')
          .insert(locationStockInserts);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Consumable created successfully'
      });
      form.reset();
      setShowScannerModal(false);
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create consumable',
        variant: 'destructive'
      });
      console.error('Error creating consumable:', error);
    }
  });

  const handleScanResult = (scannedCode: string) => {
    form.setValue('sku', scannedCode);
    setShowScannerModal(false);
  };

  const onSubmit = (data: ConsumableFormData) => {
    // Calculate total on hand from location stock
    const totalOnHand = data.locationStock.reduce((sum, loc) => sum + loc.onHand, 0);
    
    const submitData = {
      ...data,
      on_hand_qty: totalOnHand, // Set the total for the main record
      locationStock: data.locationStock
    };
    
    createConsumable.mutate(submitData);
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

                <FormField
                  control={form.control}
                  name="reorder_threshold"
                  rules={{ required: 'Reorder threshold is required', min: { value: 0, message: 'Must be positive' } }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Threshold *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="Enter reorder threshold" 
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

            {/* Information Box */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium">Understanding Thresholds vs. Levels</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Reorder Threshold:</strong> Global notification when total stock across all locations falls below this amount</p>
                <p><strong>Reorder Level:</strong> Location-specific alert when stock at that particular location falls below the threshold</p>
              </div>
            </div>

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