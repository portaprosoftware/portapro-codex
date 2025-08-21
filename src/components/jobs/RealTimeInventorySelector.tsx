import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductSelectionModal } from './ProductSelectionModal';
import { Package, Edit3 } from 'lucide-react';
import type { JobItemSelection } from '@/contexts/JobWizardContext';

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

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
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
                        `${item.quantity} Specific Units: ${item.specific_item_ids?.join(', ') || ''}`
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
        onProductSelect={(jobItems) => {
          onChange?.(jobItems);
        }}
      />
    </div>
  );
};
