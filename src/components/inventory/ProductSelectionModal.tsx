import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModernBadge } from '@/components/ui/modern-badge';

interface ProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (productId: string, productName: string) => void;
  selectedProductId?: string;
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  open,
  onOpenChange,
  onProductSelect,
  selectedProductId
}) => {
  const { data: products, isLoading } = useProducts();

  const handleProductClick = (productId: string, productName: string) => {
    onProductSelect(productId, productName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Select Product
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : (
            products?.map((product) => (
              <Card
                key={product.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
                  selectedProductId === product.id && "ring-2 ring-primary"
                )}
                onClick={() => handleProductClick(product.id, product.name)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-primary rounded-lg mb-3 flex items-center justify-center">
                    <Package className="h-12 w-12 text-white" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm truncate" title={product.name}>
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <ModernBadge variant="secondary" size="sm">
                        Product
                      </ModernBadge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {!isLoading && (!products || products.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-2">No Products Found</p>
            <p className="text-sm">No products are available for selection.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};