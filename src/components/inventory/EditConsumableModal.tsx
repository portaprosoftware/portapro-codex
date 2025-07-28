import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  reorderThreshold?: number;
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
  const form = useForm<ConsumableFormData>();

  useEffect(() => {
    if (consumable) {
      form.reset({
        name: consumable.name,
        description: consumable.description || '',
        category: consumable.category,
        sku: consumable.sku || '',
        unit_cost: consumable.unit_cost,
        unit_price: consumable.unit_price,
        locationStock: consumable.locationStock || [],
        reorder_threshold: consumable.reorder_threshold,
        is_active: consumable.is_active,
        notes: consumable.notes || ''
      });
    }
  }, [consumable, form]);

  const updateConsumable = useMutation({
    mutationFn: async (data: ConsumableFormData) => {
      if (!consumable) return;
      
      const { error } = await supabase
        .from('consumables' as any)
        .update(data)
        .eq('id', consumable.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Consumable updated successfully'
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update consumable',
        variant: 'destructive'
      });
      console.error('Error updating consumable:', error);
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
    
    updateConsumable.mutate(submitData);
  };

  if (!consumable) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Consumable</DialogTitle>
        </DialogHeader>

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
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        placeholder="0" 
                      />
                    </FormControl>
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
      </DialogContent>
    </Dialog>
  );
};