import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductSelectionModal } from './ProductSelectionModal';
import { Package, Edit3 } from 'lucide-react';
import type { JobItemSelection } from '@/contexts/JobWizardContext';

interface UnitDetails {
  id: string;
  item_code: string;
  attributes?: Record<string, any>;
}

interface RealTimeInventorySelectorProps {
  startDate: string;
  endDate?: string | null;
  value?: JobItemSelection[];
  onChange?: (items: JobItemSelection[]) => void;
}

export const RealTimeInventorySelector: React.FC<RealTimeInventorySelectorProps> = ({
  startDate,
  endDate,
  value = [],
  onChange,
}) => {
  const [showProductModal, setShowProductModal] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'for-availability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_total')
        .order('name');
      if (error) throw error;
      return data as { id: string; name: string; stock_total: number }[];
    },
  });

  // Fetch unit details for specific items
  const specificItemIds = value
    .filter(item => item.strategy === 'specific' && item.specific_item_ids)
    .flatMap(item => item.specific_item_ids || []);

  const { data: unitDetails = [] } = useQuery<UnitDetails[]>({
    queryKey: ['unit-details', specificItemIds],
    queryFn: async () => {
      if (specificItemIds.length === 0) return [];
      
      const { data: items, error: itemsError } = await supabase
        .from('product_items')
        .select('id, item_code')
        .in('id', specificItemIds);
      
      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      // Fetch attributes for these items
      const { data: attributes, error: attrError } = await supabase
        .from('product_item_attributes')
        .select('item_id, property_id, property_value')
        .in('item_id', specificItemIds);
      
      if (attrError) throw attrError;

      // Fetch property names
      const propertyIds = attributes?.map(a => a.property_id) || [];
      const { data: properties, error: propError } = await supabase
        .from('product_properties')
        .select('id, attribute_name')
        .in('id', propertyIds);
      
      if (propError) throw propError;

      // Combine item details with attributes
      return items.map(item => {
        const itemAttributes: Record<string, any> = {};
        attributes?.forEach(attr => {
          if (attr.item_id === item.id) {
            const prop = properties?.find(p => p.id === attr.property_id);
            if (prop?.attribute_name) {
              itemAttributes[prop.attribute_name.toLowerCase()] = attr.property_value;
            }
          }
        });

        return {
          id: item.id,
          item_code: item.item_code,
          attributes: itemAttributes
        };
      });
    },
    enabled: specificItemIds.length > 0,
  });

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
  };

  const getUnitDisplay = (itemIds: string[]) => {
    return itemIds.map(id => {
      const unit = unitDetails.find(u => u.id === id);
      if (!unit) return id;
      
      let display = unit.item_code;
      if (unit.attributes && Object.keys(unit.attributes).length > 0) {
        const attrs = Object.entries(unit.attributes)
          .filter(([key, value]) => value && key !== 'winterized')
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        if (attrs) {
          display += ` (${attrs})`;
        }
        if (unit.attributes.winterized) {
          display += ' - Winterized';
        }
      }
      return display;
    }).join(', ');
  };


  return (
    <div className="space-y-4">
      {/* Header with Select Products Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-base">Products & Inventory</h3>
        <Button
          onClick={() => setShowProductModal(true)}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Select Products
        </Button>
      </div>

      {/* Selected Items Summary */}
      {value.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products selected yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Select Products" to add items to this job</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {value.map((item, index) => (
            <Card key={`${item.product_id}-${item.strategy}-${index}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{getProductName(item.product_id)}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.strategy === 'bulk' ? (
                        `Quantity: ${item.quantity} (Bulk Selection)`
                      ) : (
                        `${item.quantity} Specific Units: ${getUnitDisplay(item.specific_item_ids || [])}`
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProductModal(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Product Selection Modal */}
      <ProductSelectionModal
        open={showProductModal}
        onOpenChange={setShowProductModal}
        startDate={startDate}
        endDate={endDate}
        existingJobItems={value || []}
        onProductSelect={(jobItems) => {
          // Merge new selections with existing items instead of replacing
          const updatedItems = [...(value || []), ...jobItems];
          onChange?.(updatedItems);
        }}
      />
    </div>
  );
};
