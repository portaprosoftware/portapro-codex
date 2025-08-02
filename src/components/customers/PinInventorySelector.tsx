import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Plus, Minus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  stock_total: number;
  stock_in_service: number;
  default_price_per_day?: number;
  category?: string;
}

interface InventoryAssignment {
  productId: string;
  quantity: number;
}

interface PinInventorySelectorProps {
  onAssignmentsChange: (assignments: InventoryAssignment[]) => void;
  existingAssignments?: InventoryAssignment[];
}

export function PinInventorySelector({ onAssignmentsChange, existingAssignments = [] }: PinInventorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<InventoryAssignment[]>(existingAssignments);

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

  const getAvailableStock = (product: Product) => {
    return Math.max(0, product.stock_total - product.stock_in_service);
  };

  const getAssignedQuantity = (productId: string) => {
    return assignments.find(a => a.productId === productId)?.quantity || 0;
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const maxAvailable = getAvailableStock(products?.find(p => p.id === productId) || {} as Product);
    const clampedQuantity = Math.max(0, Math.min(newQuantity, maxAvailable));
    
    const newAssignments = assignments.filter(a => a.productId !== productId);
    if (clampedQuantity > 0) {
      newAssignments.push({ productId, quantity: clampedQuantity });
    }
    
    setAssignments(newAssignments);
    onAssignmentsChange(newAssignments);
  };

  const getStockStatusColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.5) return 'bg-green-500';
    if (ratio > 0.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="w-4 h-4 animate-pulse" />
          <span>Loading inventory...</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search inventory items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Summary */}
      {assignments.length > 0 && (
        <div className="bg-primary/5 rounded-lg p-3">
          <p className="text-sm font-medium text-primary">
            {assignments.length} item(s) selected • Total: {assignments.reduce((sum, a) => sum + a.quantity, 0)} units
          </p>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {filteredProducts.map((product) => {
          const availableStock = getAvailableStock(product);
          const assignedQuantity = getAssignedQuantity(product.id);
          
          return (
            <Card key={product.id} className={`transition-all ${assignedQuantity > 0 ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-foreground truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        <div 
                          className={`w-2 h-2 rounded-full ${getStockStatusColor(availableStock, product.stock_total)}`}
                        />
                        <Badge variant="secondary" className="text-xs">
                          {availableStock} available
                        </Badge>
                      </div>
                    </div>
                    
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Stock: {product.stock_total} total • {product.stock_in_service} in service
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {availableStock > 0 ? (
                      <div className="flex items-center gap-1">
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
                            max={availableStock}
                            value={assignedQuantity}
                            onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                            className="h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(product.id, assignedQuantity + 1)}
                          disabled={assignedQuantity >= availableStock}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        No Stock
                      </Badge>
                    )}
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
          <p>No inventory items found</p>
          {searchQuery && (
            <p className="text-sm">Try adjusting your search terms</p>
          )}
        </div>
      )}
    </div>
  );
}