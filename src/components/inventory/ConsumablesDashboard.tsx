import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Edit, Package, TrendingDown, DollarSign } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getCategoryLabel } from '@/lib/consumableCategories';

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
  supplier_info?: any;
  notes?: string;
}

interface ConsumablesDashboardProps {
  consumables: Consumable[];
  isLoading: boolean;
  onEdit: (consumable: Consumable) => void;
  onReceiveStock: (consumable: Consumable) => void;
  onRefetch: () => void;
}

export const ConsumablesDashboard: React.FC<ConsumablesDashboardProps> = ({
  consumables,
  isLoading,
  onEdit,
  onReceiveStock,
}) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  const lowStockItems = consumables.filter(c => c.on_hand_qty <= c.reorder_threshold);
  const totalValue = consumables.reduce((sum, c) => sum + (c.on_hand_qty * c.unit_cost), 0);
  const categories = [...new Set(consumables.map(c => c.category))];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold">{consumables.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{lowStockItems.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-secondary" />
              <span className="text-2xl font-bold">{categories.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="text-2xl font-bold">${totalValue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.on_hand_qty} remaining, reorder at {item.reorder_threshold})
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onReceiveStock(item)}
                  >
                    Receive Stock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consumables Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Consumables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">On Hand</th>
                  <th className="text-left p-2">Reorder Level</th>
                  <th className="text-left p-2">Unit Cost</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {consumables.map(consumable => (
                  <tr key={consumable.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{consumable.name}</div>
                        {consumable.description && (
                          <div className="text-sm text-muted-foreground">{consumable.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{getCategoryLabel(consumable.category)}</Badge>
                    </td>
                    <td className="p-2 text-sm">{consumable.sku || '-'}</td>
                    <td className="p-2">
                      <span className={consumable.on_hand_qty <= consumable.reorder_threshold ? 'text-destructive font-medium' : ''}>
                        {consumable.on_hand_qty}
                      </span>
                    </td>
                    <td className="p-2">{consumable.reorder_threshold}</td>
                    <td className="p-2">${consumable.unit_cost.toFixed(2)}</td>
                    <td className="p-2">
                      <Badge variant={consumable.is_active ? 'default' : 'secondary'}>
                        {consumable.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onEdit(consumable)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onReceiveStock(consumable)}
                        >
                          <Package className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};