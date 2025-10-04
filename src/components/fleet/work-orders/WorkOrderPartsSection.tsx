import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertCircle, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WorkOrderPart {
  id: string;
  part_id?: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  source: 'truck_stock' | 'warehouse' | 'vendor';
  storage_location_id?: string;
}

interface WorkOrderPartsSectionProps {
  parts: WorkOrderPart[];
  onChange: (parts: WorkOrderPart[]) => void;
  vehicleId?: string;
}

export const WorkOrderPartsSection: React.FC<WorkOrderPartsSectionProps> = ({
  parts,
  onChange,
  vehicleId
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch consumables for search
  const { data: consumables = [] } = useQuery({
    queryKey: ['consumables-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      const { data, error } = await supabase
        .from('consumables')
        .select('id, name, sku, unit_cost, base_unit, on_hand_qty, reorder_threshold')
        .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2
  });

  const addPart = (consumable?: any) => {
    const newPart: WorkOrderPart = {
      id: `temp-${Date.now()}`,
      part_id: consumable?.id,
      part_name: consumable?.name || '',
      quantity: 1,
      unit_cost: consumable?.unit_cost || 0,
      source: 'warehouse'
    };
    
    onChange([...parts, newPart]);
    setSearchTerm('');
  };

  const updatePart = (partId: string, updates: Partial<WorkOrderPart>) => {
    onChange(parts.map(part => 
      part.id === partId ? { ...part, ...updates } : part
    ));
  };

  const removePart = (partId: string) => {
    onChange(parts.filter(part => part.id !== partId));
  };

  const calculateTotal = () => {
    return parts.reduce((sum, part) => sum + (part.quantity * part.unit_cost), 0);
  };

  const getStockWarning = (part: WorkOrderPart) => {
    const consumable = consumables.find(c => c.id === part.part_id);
    if (!consumable) return null;
    
    const availableQty = consumable.on_hand_qty;
    const threshold = consumable.reorder_threshold;
    
    if (availableQty < part.quantity) {
      return { level: 'critical', message: `Only ${availableQty} in stock!` };
    } else if (availableQty - part.quantity < threshold) {
      return { level: 'warning', message: `Low stock after use (${availableQty - part.quantity} remaining)` };
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Parts & Fluids</CardTitle>
          <Badge variant="outline" className="text-xs">
            Total: ${calculateTotal().toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search and add */}
        <div className="space-y-2">
          <Label className="text-xs">Search Parts</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => addPart()}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search results dropdown */}
          {searchTerm.length >= 2 && consumables.length > 0 && (
            <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto bg-background">
              {consumables.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addPart(item)}
                  className="w-full text-left p-2 hover:bg-muted rounded text-sm flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      SKU: {item.sku} • ${item.unit_cost}/{item.base_unit}
                    </div>
                  </div>
                  <Badge variant={item.on_hand_qty > item.reorder_threshold ? 'outline' : 'secondary'} className="text-xs">
                    {item.on_hand_qty} in stock
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Parts list */}
        {parts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No parts added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {parts.map((part) => {
              const stockWarning = getStockWarning(part);
              
              return (
                <div key={part.id} className="border rounded-lg p-3 space-y-3 bg-background">
                  {/* Part name */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Input
                        value={part.part_name}
                        onChange={(e) => updatePart(part.id, { part_name: e.target.value })}
                        placeholder="Part name"
                        className="text-sm font-medium"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePart(part.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Stock warning */}
                  {stockWarning && (
                    <div className={`flex items-center gap-2 p-2 rounded text-xs ${
                      stockWarning.level === 'critical' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      <AlertCircle className="h-3 w-3" />
                      <span>{stockWarning.message}</span>
                    </div>
                  )}

                  {/* Quantity, unit cost, source */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`${part.id}-qty`} className="text-xs">Qty</Label>
                      <Input
                        id={`${part.id}-qty`}
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => updatePart(part.id, { quantity: parseFloat(e.target.value) || 1 })}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor={`${part.id}-cost`} className="text-xs">Unit $</Label>
                      <Input
                        id={`${part.id}-cost`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={part.unit_cost}
                        onChange={(e) => updatePart(part.id, { unit_cost: parseFloat(e.target.value) || 0 })}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`${part.id}-source`} className="text-xs">Source</Label>
                      <Select
                        value={part.source}
                        onValueChange={(value: any) => updatePart(part.id, { source: value })}
                      >
                        <SelectTrigger id={`${part.id}-source`} className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="truck_stock">Truck</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="flex justify-end">
                    <Badge variant="secondary" className="text-xs">
                      Subtotal: ${(part.quantity * part.unit_cost).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total */}
        {parts.length > 0 && (
          <div className="pt-2 border-t flex justify-between items-center">
            <span className="text-sm font-medium">Parts Total</span>
            <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
