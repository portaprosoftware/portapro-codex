import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailabilityEngine } from '@/hooks/useAvailabilityEngine';
import { Search, Package } from 'lucide-react';
import { PRODUCT_TYPES, type ProductType } from '@/lib/productTypes';

interface Product {
  id: string;
  name: string;
  stock_total: number;
  image_url?: string;
}

interface ProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string;
  endDate?: string | null;
  onProductSelect: (productId: string) => void;
  selectedProductId?: string;
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  open,
  onOpenChange,
  startDate,
  endDate,
  onProductSelect,
  selectedProductId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [selectedProductType, setSelectedProductType] = useState('all');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'for-selection', searchTerm, selectedProductType],
    queryFn: async () => {
      try {
        let data = [];
        
        // First, get products that match by name or manufacturer
        let nameQuery = supabase
          .from('products')
          .select('id, name, stock_total, image_url')
          .order('name');

        if (searchTerm) {
          nameQuery = nameQuery.or(`name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`);
        }

        if (selectedProductType && selectedProductType !== 'all') {
          nameQuery = nameQuery.eq('product_type', selectedProductType as ProductType);
        }

        const { data: nameResults, error: nameError } = await nameQuery;
        if (nameError) throw nameError;
        
        if (nameResults) {
          data = [...nameResults];
        }

        // If we have a search query, also search individual product items by tool number
        if (searchTerm) {
          // Get product IDs that have matching tool numbers in their items
          const { data: itemResults, error: itemError } = await supabase
            .from('product_items')
            .select('product_id')
            .ilike('tool_number', `%${searchTerm}%`);
            
          if (itemError) throw itemError;
          
          if (itemResults && itemResults.length > 0) {
            const productIds = itemResults.map(item => item.product_id);
            
            // Get full product data for products that have matching tool numbers
            let toolQuery = supabase
              .from('products')
              .select('id, name, stock_total, image_url')
              .in('id', productIds);

            if (selectedProductType && selectedProductType !== 'all') {
              toolQuery = toolQuery.eq('product_type', selectedProductType as ProductType);
            }

            const { data: toolResults, error: toolError } = await toolQuery;
            if (toolError) throw toolError;
            
            if (toolResults) {
              // Merge with existing results, avoiding duplicates
              const existingIds = new Set(data.map(p => p.id));
              const newProducts = toolResults.filter(p => !existingIds.has(p.id));
              data = [...data, ...newProducts];
            }
          }
        }

        return data as Product[];
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
    enabled: open,
  });

  const filteredProducts = useMemo(() => {
    // Since we're handling search in the query, just return the products
    return products;
  }, [products]);

  const handleProductSelect = (productId: string) => {
    onProductSelect(productId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none md:max-w-4xl md:h-auto md:max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Select Product</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search - moved to top */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, code, tool number, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Location and Product Type Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location Filter */}
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="yard">Yard</SelectItem>
                <SelectItem value="field">Field</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            {/* Product Type Filter */}
            <Select value={selectedProductType} onValueChange={setSelectedProductType}>
              <SelectTrigger>
                <SelectValue placeholder="All Product Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Product Types</SelectItem>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading products...</div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <div className="text-muted-foreground">
                  {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    startDate={startDate}
                    endDate={endDate}
                    isSelected={selectedProductId === product.id}
                    onSelect={() => handleProductSelect(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ProductCardProps {
  product: Product;
  startDate: string;
  endDate?: string | null;
  isSelected: boolean;
  onSelect: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  startDate,
  endDate,
  isSelected,
  onSelect
}) => {
  const getMethodDisplayText = (method: string) => {
    switch (method) {
      case 'stock_total':
        return 'Total Stock';
      case 'individual_tracking':
        return 'Individual Units';
      case 'availability_check':
        return 'Real-time Check';
      default:
        return method;
    }
  };

  const availability = useAvailabilityEngine(
    product.id,
    startDate,
    endDate || undefined
  );

  const getAvailabilityColor = (available: number, total: number) => {
    if (available === 0) return 'destructive';
    if (available <= total * 0.3) return 'secondary';
    return 'default';
  };

  return (
    <div
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      {/* Product Image */}
      <div className="aspect-square w-full mb-3 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        {!product.image_url && (
          <Package className="h-12 w-12 text-muted-foreground" />
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
        
        {/* Availability */}
        <div className="space-y-1">
          {availability.isLoading ? (
            <Badge variant="outline" className="text-xs">
              Loading...
            </Badge>
          ) : (
            <Badge 
              variant={getAvailabilityColor(
                availability.data?.available ?? 0, 
                availability.data?.total ?? 0
              )}
              className="text-xs"
            >
              {availability.data?.available ?? 0} of {availability.data?.total ?? 0} available
            </Badge>
          )}
          
          {availability.data?.method && availability.data.method !== 'stock_total' && (
            <div className="text-xs text-muted-foreground">
              {getMethodDisplayText(availability.data.method)}
            </div>
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};