import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Loader2 } from 'lucide-react';
import { EditItemModal } from '@/components/inventory/EditItemModal';

export const ProductItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['product-item', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleEditItem = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div>Item not found.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{item.barcode}</h1>
          <p className="text-muted-foreground">Product Item ID: {item.id}</p>
        </div>
        <Button onClick={handleEditItem}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>Information about this specific product item.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="text-lg font-semibold">{item.status}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Condition</div>
              <div className="text-lg font-semibold">{item.condition}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Location</div>
              <div className="text-lg font-semibold">{item.location}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Color</div>
              <div className="text-lg font-semibold">{item.color}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Size</div>
              <div className="text-lg font-semibold">{item.size}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Material</div>
              <div className="text-lg font-semibold">{item.material}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">Notes</div>
            <div className="text-lg font-semibold">{item.notes || 'N/A'}</div>
          </div>
        </CardContent>
      </Card>
      
      {id && (
        <EditItemModal
          itemId={id}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
};
