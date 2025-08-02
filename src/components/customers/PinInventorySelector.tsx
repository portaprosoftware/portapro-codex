import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Plus, Minus, Grid3X3, List, Image } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  stock_total: number;
  stock_in_service: number;
  default_price_per_day?: number;
  category?: string;
}

interface TemplateAssignment {
  productId: string;
  quantity: number;
}

interface PinInventorySelectorProps {
  onAssignmentsChange: (assignments: TemplateAssignment[]) => void;
  existingAssignments?: TemplateAssignment[];
}

export function PinInventorySelector({ onAssignmentsChange, existingAssignments = [] }: PinInventorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<TemplateAssignment[]>(existingAssignments);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products-for-pins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('track_inventory', true)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const getAssignedQuantity = (productId: string) => {
    return assignments.find(a => a.productId === productId)?.quantity || 0;
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const clampedQuantity = Math.max(0, newQuantity);
    
    const newAssignments = assignments.filter(a => a.productId !== productId);
    if (clampedQuantity > 0) {
      newAssignments.push({ productId, quantity: clampedQuantity });
    }
    
    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
  };

  const getPlaceholderImage = (productName: string) => {
    // Use a consistent placeholder based on product name
    const images = [
      'photo-1488590528505-98d2b5aba04b', // laptop
      'photo-1518770660439-4636190af475', // circuit board  
      'photo-1487058792275-0ad4aaf24ca7', // code
      'photo-1485833077593-4278bba3f11f', // deer
      'photo-1441057206919-63d19fac2369', // penguins
      'photo-1501286353178-1ec881214838'  // monkey
    ];
    const index = productName.length % images.length;
    return `https://images.unsplash.com/${images[index]}?w=100&h=100&fit=crop`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="w-4 h-4 animate-pulse" />
          <span>Loading products...</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-lg border bg-background">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      {assignments.length > 0 && (
        <div className="bg-primary/5 rounded-lg p-3">
          <p className="text-sm font-medium text-primary">
            {assignments.length} template item(s) • Total: {assignments.reduce((sum, a) => sum + a.quantity, 0)} units
          </p>
        </div>
      )}

      {/* Product Display */}
      <div className={`max-h-96 overflow-y-auto ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-3'}`}>
        {filteredProducts.map((product) => {
          const assignedQuantity = getAssignedQuantity(product.id);
          
          if (viewMode === 'grid') {
            return (
              <Card key={product.id} className={`transition-all ${assignedQuantity > 0 ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-3">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={getPlaceholderImage(product.name)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <Package className="w-8 h-8 text-muted-foreground hidden" />
                    </div>
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    {product.category && (
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(product.id, assignedQuantity - 1)}
                        disabled={assignedQuantity <= 0}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="0"
                        value={assignedQuantity}
                        onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                        className="h-6 w-12 text-center text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(product.id, assignedQuantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // List view
          return (
            <Card key={product.id} className={`transition-all ${assignedQuantity > 0 ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img 
                        src={getPlaceholderImage(product.name)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <Package className="w-6 h-6 text-muted-foreground hidden" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground truncate">
                          {product.name}
                        </h4>
                        {product.category && (
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        )}
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, assignedQuantity - 1)}
                      disabled={assignedQuantity <= 0}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <div className="w-12">
                      <Input
                        type="number"
                        min="0"
                        value={assignedQuantity}
                        onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                        className="h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(product.id, assignedQuantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No products found</p>
          {searchQuery && (
            <p className="text-sm">Try adjusting your search terms</p>
          )}
        </div>
      )}
    </div>
  );
}