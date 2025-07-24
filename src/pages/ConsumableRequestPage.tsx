import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConsumableRequestModal } from '@/components/inventory/ConsumableRequestModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, QrCode, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Consumable {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  on_hand_qty: number;
  reorder_threshold: number;
  is_active: boolean;
}

export const ConsumableRequestPage: React.FC = () => {
  const { consumableId } = useParams<{ consumableId: string }>();
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data: consumable, isLoading, error } = useQuery({
    queryKey: ['consumable', consumableId],
    queryFn: async () => {
      if (!consumableId) throw new Error('No consumable ID provided');
      
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('*')
        .eq('id', consumableId)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data as unknown as Consumable;
    },
    enabled: !!consumableId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !consumable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Item Not Found</h2>
            <p className="text-muted-foreground">
              The consumable you're looking for is not available or may have been deactivated.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your supervisor or try scanning a different QR code.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLowStock = consumable.on_hand_qty <= consumable.reorder_threshold;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <QrCode className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle>Consumable Request</CardTitle>
            <p className="text-muted-foreground">
              Scan-to-request system for field supplies
            </p>
          </CardHeader>
        </Card>

        {/* Consumable Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Item Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                <p className="font-medium">{consumable.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p><Badge variant="outline">{consumable.category}</Badge></p>
              </div>

              {consumable.sku && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  <p className="font-mono text-sm">{consumable.sku}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
                <p className={`font-medium ${isLowStock ? 'text-destructive' : ''}`}>
                  {consumable.on_hand_qty} units
                  {isLowStock && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Low Stock
                    </Badge>
                  )}
                </p>
              </div>
            </div>

            {consumable.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{consumable.description}</p>
              </div>
            )}

            {isLowStock && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Low Stock Warning</span>
                </div>
                <p className="text-sm text-destructive mt-1">
                  This item is running low. Current stock is at or below the reorder threshold 
                  of {consumable.reorder_threshold} units.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">Need this item?</h3>
              <p className="text-muted-foreground">
                Submit a request and we'll get it to you as soon as possible.
              </p>
              
              <Button 
                onClick={() => setShowRequestModal(true)}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Package className="w-4 h-4 mr-2" />
                Request This Item
              </Button>

              <p className="text-xs text-muted-foreground">
                Your request will be sent to the inventory team for processing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Click "Request This Item" above</li>
              <li>Fill out the request form with your details</li>
              <li>Submit your request</li>
              <li>Inventory team will review and process your request</li>
              <li>You'll be notified when your items are ready for pickup or delivery</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Request Modal */}
      <ConsumableRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        consumableId={consumable.id}
        consumableName={consumable.name}
      />
    </div>
  );
};