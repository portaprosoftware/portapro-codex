import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Package, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useUnifiedStockManagement } from '@/hooks/useUnifiedStockManagement';

interface StockOperationsPanelProps {
  productId: string;
  productName: string;
  onClose?: () => void;
}

export function StockOperationsPanel({ productId, productName, onClose }: StockOperationsPanelProps) {
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  
  const {
    stockData,
    masterStock,
    bulkPool,
    trackedAvailable,
    convertBulkToTracked,
    addTrackedInventory,
    adjustMasterStock,
    isConverting,
    isAddingTracked,
    isAdjusting
  } = useUnifiedStockManagement(productId);

  const handleSubmit = async () => {
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return;

    switch (selectedOperation) {
      case 'convert_bulk':
        convertBulkToTracked(qty);
        break;
      case 'add_tracked':
        addTrackedInventory(qty);
        break;
      case 'add_bulk':
        adjustMasterStock({
          quantityChange: qty,
          reason: 'Added bulk inventory',
          notes: `Added ${qty} units to bulk pool`
        });
        break;
      case 'remove_bulk':
        adjustMasterStock({
          quantityChange: -qty,
          reason: 'Removed bulk inventory',
          notes: `Removed ${qty} units from bulk pool`
        });
        break;
    }

    // Reset form
    setSelectedOperation(null);
    setQuantity('1');
    onClose?.();
  };

  const isLoading = isConverting || isAddingTracked || isAdjusting;

  return (
    <Card className="w-full max-w-lg max-h-[80vh] overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="w-4 h-4" />
          Stock Operations - {productName}
        </CardTitle>
        {stockData && (
          <div className="flex gap-2 text-sm">
            <Badge variant="secondary" className="text-xs">{masterStock} Total</Badge>
            <Badge variant="secondary" className="text-xs">{bulkPool} Bulk Pool</Badge>
            <Badge variant="secondary" className="text-xs">{trackedAvailable} Tracked Available</Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Operation Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Operation:</Label>
          
          {/* Convert Bulk to Tracked */}
          <div 
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              selectedOperation === 'convert_bulk' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedOperation('convert_bulk')}
          >
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-500" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Convert Bulk Pool to Tracked Items</h4>
                <p className="text-xs text-muted-foreground">
                  Convert existing bulk units to individually tracked items. Total inventory stays the same.
                </p>
              </div>
              {bulkPool === 0 && (
                <Badge variant="destructive" className="text-xs">
                  No bulk pool
                </Badge>
              )}
            </div>
          </div>

          {/* Add New Tracked Inventory */}
          <div 
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              selectedOperation === 'add_tracked' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedOperation('add_tracked')}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-500" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Add New Tracked Inventory</h4>
                <p className="text-xs text-muted-foreground">
                  Add new inventory as individually tracked items. Increases total inventory.
                </p>
              </div>
            </div>
          </div>

          {/* Add Bulk Inventory */}
          <div 
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              selectedOperation === 'add_bulk' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedOperation('add_bulk')}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-500" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Add Bulk Inventory</h4>
                <p className="text-xs text-muted-foreground">
                  Add new inventory to the bulk pool. Increases total inventory.
                </p>
              </div>
            </div>
          </div>

          {/* Remove Bulk Inventory */}
          <div 
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              selectedOperation === 'remove_bulk' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedOperation('remove_bulk')}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <div className="flex-1">
                <h4 className="font-medium text-sm">Remove Bulk Inventory</h4>
                <p className="text-xs text-muted-foreground">
                  Remove inventory from the bulk pool. Decreases total inventory.
                </p>
              </div>
              {bulkPool === 0 && (
                <Badge variant="destructive" className="text-xs">
                  No bulk pool
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Quantity Input & Submit */}
        {selectedOperation && (
          <div className="space-y-3 pt-3 border-t">
            <div className="space-y-1">
              <Label htmlFor="quantity" className="text-sm">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                className="w-24 h-8"
              />
            </div>

            {/* Validation Warnings */}
            {selectedOperation === 'convert_bulk' && parseInt(quantity) > bulkPool && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="w-3 h-3" />
                Cannot convert more than {bulkPool} units from bulk pool
              </div>
            )}

            {selectedOperation === 'remove_bulk' && parseInt(quantity) > bulkPool && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="w-3 h-3" />
                Cannot remove more than {bulkPool} units from bulk pool
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={
                  isLoading || 
                  !quantity || 
                  parseInt(quantity) <= 0 ||
                  (selectedOperation === 'convert_bulk' && parseInt(quantity) > bulkPool) ||
                  (selectedOperation === 'remove_bulk' && parseInt(quantity) > bulkPool)
                }
                size="sm"
              >
                {isLoading ? 'Processing...' : 'Apply'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedOperation(null);
                  setQuantity('1');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs">
          <h5 className="font-medium mb-1 text-sm">Understanding Operations:</h5>
          <ul className="space-y-0.5 text-muted-foreground">
            <li>• <strong>Convert:</strong> Changes bulk units to tracked without affecting total count</li>
            <li>• <strong>Add Tracked:</strong> Creates new tracked items and increases inventory</li>
            <li>• <strong>Add Bulk:</strong> Increases bulk pool and total inventory</li>
            <li>• <strong>Remove Bulk:</strong> Decreases bulk pool and total inventory</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}