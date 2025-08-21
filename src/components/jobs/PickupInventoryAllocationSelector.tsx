import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Plus, Minus, AlertCircle } from 'lucide-react';
import { JobItemSelection } from '@/contexts/JobWizardContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PickupInventoryAllocationSelectorProps {
  deliveryItems: JobItemSelection[];
  mainPickupItems: JobItemSelection[];
  partialPickupItems: { [pickupId: string]: JobItemSelection[] };
  partialPickups: Array<{
    id: string;
    date: string;
    time?: string | null;
    notes?: string;
    is_priority?: boolean;
  }>;
  onMainPickupChange: (items: JobItemSelection[]) => void;
  onPartialPickupChange: (pickupId: string, items: JobItemSelection[]) => void;
}

interface ProductDetails {
  id: string;
  name: string;
}

export const PickupInventoryAllocationSelector: React.FC<PickupInventoryAllocationSelectorProps> = ({
  deliveryItems,
  mainPickupItems,
  partialPickupItems,
  partialPickups,
  onMainPickupChange,
  onPartialPickupChange
}) => {
  // Fetch product details for delivery items
  const { data: products } = useQuery({
    queryKey: ['products-for-pickup-allocation', deliveryItems.map(item => item.product_id)],
    queryFn: async () => {
      if (deliveryItems.length === 0) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .in('id', deliveryItems.map(item => item.product_id));
      
      if (error) throw error;
      return data as ProductDetails[];
    },
    enabled: deliveryItems.length > 0
  });

  const getProductName = (productId: string) => {
    return products?.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  // Calculate allocated quantities for each product
  const getAllocatedQuantity = (productId: string) => {
    let total = 0;
    
    // Add main pickup quantity
    const mainPickupItem = mainPickupItems.find(item => item.product_id === productId);
    if (mainPickupItem) {
      total += mainPickupItem.quantity;
    }
    
    // Add partial pickup quantities
    Object.values(partialPickupItems).forEach(items => {
      const item = items.find(item => item.product_id === productId);
      if (item) {
        total += item.quantity;
      }
    });
    
    return total;
  };

  const getDeliveryQuantity = (productId: string) => {
    const deliveryItem = deliveryItems.find(item => item.product_id === productId);
    return deliveryItem ? deliveryItem.quantity : 0;
  };

  const getRemainingQuantity = (productId: string) => {
    return getDeliveryQuantity(productId) - getAllocatedQuantity(productId);
  };

  const updateMainPickupQuantity = (productId: string, quantity: number) => {
    const updatedItems = [...mainPickupItems];
    const existingIndex = updatedItems.findIndex(item => item.product_id === productId);
    
    if (quantity <= 0) {
      if (existingIndex >= 0) {
        updatedItems.splice(existingIndex, 1);
      }
    } else {
      const deliveryItem = deliveryItems.find(item => item.product_id === productId);
      if (deliveryItem) {
        const itemData = {
          product_id: productId,
          quantity,
          strategy: deliveryItem.strategy,
          specific_item_ids: deliveryItem.specific_item_ids,
          attributes: deliveryItem.attributes,
          bulk_additional: deliveryItem.bulk_additional
        };
        
        if (existingIndex >= 0) {
          updatedItems[existingIndex] = itemData;
        } else {
          updatedItems.push(itemData);
        }
      }
    }
    
    onMainPickupChange(updatedItems);
  };

  const updatePartialPickupQuantity = (pickupId: string, productId: string, quantity: number) => {
    const currentItems = partialPickupItems[pickupId] || [];
    const updatedItems = [...currentItems];
    const existingIndex = updatedItems.findIndex(item => item.product_id === productId);
    
    if (quantity <= 0) {
      if (existingIndex >= 0) {
        updatedItems.splice(existingIndex, 1);
      }
    } else {
      const deliveryItem = deliveryItems.find(item => item.product_id === productId);
      if (deliveryItem) {
        const itemData = {
          product_id: productId,
          quantity,
          strategy: deliveryItem.strategy,
          specific_item_ids: deliveryItem.specific_item_ids,
          attributes: deliveryItem.attributes,
          bulk_additional: deliveryItem.bulk_additional
        };
        
        if (existingIndex >= 0) {
          updatedItems[existingIndex] = itemData;
        } else {
          updatedItems.push(itemData);
        }
      }
    }
    
    onPartialPickupChange(pickupId, updatedItems);
  };

  const getMainPickupQuantity = (productId: string) => {
    const item = mainPickupItems.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  const getPartialPickupQuantity = (pickupId: string, productId: string) => {
    const items = partialPickupItems[pickupId] || [];
    const item = items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  const hasValidationErrors = useMemo(() => {
    return deliveryItems.some(item => getRemainingQuantity(item.product_id) < 0);
  }, [deliveryItems, mainPickupItems, partialPickupItems]);

  if (!deliveryItems.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No delivery items selected yet.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add delivery items first to allocate them to pickup jobs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Pickup Inventory Allocation</h3>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Allocate which inventory will be picked up during each pickup job. 
        Total pickup quantities cannot exceed delivery quantities.
      </p>

      {hasValidationErrors && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Some products are over-allocated. Please adjust quantities.</span>
        </div>
      )}

      <div className="space-y-4">
        {deliveryItems.map((deliveryItem) => {
          const productId = deliveryItem.product_id;
          const deliveryQty = deliveryItem.quantity;
          const allocatedQty = getAllocatedQuantity(productId);
          const remainingQty = getRemainingQuantity(productId);
          const isOverAllocated = remainingQty < 0;

          return (
            <Card key={productId} className={isOverAllocated ? "border-destructive" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{getProductName(productId)}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Delivery: {deliveryQty}
                    </Badge>
                    <Badge 
                      variant={isOverAllocated ? "destructive" : remainingQty === 0 ? "default" : "secondary"}
                    >
                      Remaining: {remainingQty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Main Pickup Allocation */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Final Pickup</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMainPickupQuantity(productId, Math.max(0, getMainPickupQuantity(productId) - 1))}
                      disabled={getMainPickupQuantity(productId) <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max={deliveryQty}
                      value={getMainPickupQuantity(productId)}
                      onChange={(e) => updateMainPickupQuantity(productId, parseInt(e.target.value) || 0)}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMainPickupQuantity(productId, getMainPickupQuantity(productId) + 1)}
                      disabled={remainingQty <= 0 && getMainPickupQuantity(productId) >= deliveryQty}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-2">units</span>
                  </div>
                </div>

                {/* Partial Pickup Allocations */}
                {partialPickups.map((pickup, index) => (
                  <div key={pickup.id} className="space-y-2">
                    <Separator />
                    <Label className="text-sm font-medium">
                      Partial Pickup #{index + 1}
                      {pickup.date && (
                        <span className="text-muted-foreground ml-2">
                          ({new Date(pickup.date).toLocaleDateString()})
                        </span>
                      )}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePartialPickupQuantity(pickup.id, productId, Math.max(0, getPartialPickupQuantity(pickup.id, productId) - 1))}
                        disabled={getPartialPickupQuantity(pickup.id, productId) <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max={deliveryQty}
                        value={getPartialPickupQuantity(pickup.id, productId)}
                        onChange={(e) => updatePartialPickupQuantity(pickup.id, productId, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePartialPickupQuantity(pickup.id, productId, getPartialPickupQuantity(pickup.id, productId) + 1)}
                        disabled={remainingQty <= 0 && getPartialPickupQuantity(pickup.id, productId) >= deliveryQty}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground ml-2">units</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};