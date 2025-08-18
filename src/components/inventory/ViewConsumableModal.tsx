import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCategoryDisplay } from '@/lib/categoryUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, MapPin, DollarSign, AlertTriangle, Tag, FileText } from 'lucide-react';

interface Consumable {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  unit_cost: number;
  unit_price: number;
  on_hand_qty: number;
  reorder_threshold: number;
  is_active: boolean;
  notes?: string;
  base_unit: string;
  supplier_info: any;
  location_stock: LocationStockItem[];
  created_at: string;
  updated_at: string;
}

interface LocationStockItem {
  locationId: string;
  locationName: string;
  quantity: number;
  lowStockThreshold?: number;
}

interface ViewConsumableModalProps {
  consumable: Consumable | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewConsumableModal: React.FC<ViewConsumableModalProps> = ({
  consumable,
  isOpen,
  onClose
}) => {
  if (!consumable) return null;

  const totalLocations = consumable.location_stock?.length || 0;
  const locationsWithStock = consumable.location_stock?.filter(loc => loc.quantity > 0).length || 0;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = () => {
    if (consumable.on_hand_qty <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (consumable.on_hand_qty <= consumable.reorder_threshold) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const stockStatus = getStockStatus();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5" />
            {consumable.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="w-4 h-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-base font-medium">{consumable.name}</p>
              </div>

              {consumable.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-700">{consumable.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-sm">{formatCategoryDisplay(consumable.category)}</p>
              </div>

              {consumable.sku && (
                <div>
                  <label className="text-sm font-medium text-gray-500">SKU</label>
                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{consumable.sku}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Base Unit</label>
                <p className="text-sm">{consumable.base_unit}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center gap-2">
                  <Badge className={stockStatus.color}>
                    {stockStatus.label}
                  </Badge>
                  <Badge variant={consumable.is_active ? "default" : "secondary"}>
                    {consumable.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="w-4 h-4" />
                Pricing & Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Unit Cost</label>
                <p className="text-base font-medium">{formatCurrency(consumable.unit_cost)} per {consumable.base_unit}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Unit Price</label>
                <p className="text-base font-medium">{formatCurrency(consumable.unit_price)} per {consumable.base_unit}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Margin</label>
                <p className="text-sm">
                  {consumable.unit_cost > 0 
                    ? `${(((consumable.unit_price - consumable.unit_cost) / consumable.unit_cost) * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Total Value (On Hand)</label>
                <p className="text-base font-medium">
                  {formatCurrency(consumable.on_hand_qty * consumable.unit_cost)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4" />
                Inventory Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">On Hand Quantity</label>
                <p className="text-base font-medium">{consumable.on_hand_qty} {consumable.base_unit}s</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Reorder Threshold</label>
                <p className="text-sm">{consumable.reorder_threshold} {consumable.base_unit}s</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Storage Locations</label>
                <p className="text-sm">{locationsWithStock} of {totalLocations} locations have stock</p>
              </div>
            </CardContent>
          </Card>

          {/* Location Stock Details */}
          {consumable.location_stock && consumable.location_stock.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4" />
                  Location Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consumable.location_stock.map((location, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{location.locationName}</p>
                        {location.lowStockThreshold && (
                          <p className="text-xs text-gray-500">Alert at {location.lowStockThreshold}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{location.quantity}</p>
                        {location.lowStockThreshold && location.quantity <= location.lowStockThreshold && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Low</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {consumable.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{consumable.notes}</p>
                </div>
              )}

              {consumable.supplier_info && Object.keys(consumable.supplier_info).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Supplier Information</label>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {JSON.stringify(consumable.supplier_info, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-600">{formatDate(consumable.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-600">{formatDate(consumable.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};