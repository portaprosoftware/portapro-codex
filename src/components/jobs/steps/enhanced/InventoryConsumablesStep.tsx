import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Package, Plus, DollarSign, List, Grid, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { JobConsumableLocationPicker } from '@/components/inventory/JobConsumableLocationPicker';

interface InventoryItem {
  id: string;
  product_id: string;
  name: string;
  total_owned: number;
  reserved_accepted: number;
  reserved_pending: number;
  available: number;
  selected_quantity: number;
  selected_units: IndividualUnit[];
}

interface IndividualUnit {
  id: string;
  item_code: string;
  product_id: string;
  product_name: string;
  status: string;
  condition?: string;
  color?: string;
  size?: string;
  winterized?: boolean;
  selected: boolean;
}

interface ConsumableItem {
  id: string;
  name: string;
  on_hand_qty: number;
  unit_price: number;
  selected_quantity: number;
  line_total: number;
  locationAllocations?: LocationConsumableAllocation[];
}

interface LocationConsumableAllocation {
  locationId: string;
  locationName: string;
  quantity: number;
  availableStock: number;
}

interface InventoryConsumablesData {
  // Bulk Inventory
  bulkItems: InventoryItem[];
  
  // Individual Units
  selectSpecificUnits: boolean;
  selectedUnits: IndividualUnit[];
  
  // Consumables
  addConsumables: boolean;
  consumablesBillingMethod: 'per-use' | 'bundle' | 'subscription';
  selectedConsumables: ConsumableItem[];
  selectedBundle: string | null;
  subscriptionEnabled: boolean;
  
  // Subtotals
  inventorySubtotal: number;
  consumablesSubtotal: number;
}

interface InventoryConsumablesStepProps {
  data: InventoryConsumablesData;
  onUpdate: (data: InventoryConsumablesData) => void;
}

export const InventoryConsumablesStep: React.FC<InventoryConsumablesStepProps> = ({ 
  data, 
  onUpdate 
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [individualUnits, setIndividualUnits] = useState<IndividualUnit[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  useEffect(() => {
    calculateSubtotals();
  }, [
    data.bulkItems,
    data.selectedUnits,
    data.selectedConsumables,
    data.selectedBundle,
    data.subscriptionEnabled
  ]);

  const fetchInventoryData = async () => {
    try {
      // Mock data for now until database schema is updated
      const mockProducts = [
        { id: 'a1b2c3d4-e5f6-4321-8765-123456789abc', name: 'Standard Portable Toilet', stock_total: 50 },
        { id: 'b2c3d4e5-f6a1-5432-9876-234567890bcd', name: 'Deluxe Portable Toilet', stock_total: 25 },
        { id: 'c3d4e5f6-a1b2-6543-0987-345678901cde', name: 'Handicap Accessible Unit', stock_total: 10 },
        { id: 'd4e5f6a1-b2c3-7654-1098-456789012def', name: 'Hand Wash Station', stock_total: 15 }
      ];

      const mockIndividualUnits = [
        { id: '11111111-1111-1111-1111-111111111111', item_code: 'PT-001', product_id: 'a1b2c3d4-e5f6-4321-8765-123456789abc', product_name: 'Standard Portable Toilet', status: 'available', condition: 'Good', color: 'Blue', size: 'Standard', winterized: false },
        { id: '22222222-2222-2222-2222-222222222222', item_code: 'PT-002', product_id: 'a1b2c3d4-e5f6-4321-8765-123456789abc', product_name: 'Standard Portable Toilet', status: 'available', condition: 'Excellent', color: 'Blue', size: 'Standard', winterized: true },
        { id: '33333333-3333-3333-3333-333333333333', item_code: 'DX-001', product_id: 'b2c3d4e5-f6a1-5432-9876-234567890bcd', product_name: 'Deluxe Portable Toilet', status: 'available', condition: 'Good', color: 'Tan', size: 'Large', winterized: false }
      ];

      // Fetch consumables from database
      const { data: consumablesData } = await supabase
        .from('consumables')
        .select('id, name, on_hand_qty, unit_price')
        .eq('is_active', true)
        .order('name');

      // Fetch consumable bundles from database
      const { data: bundlesData } = await supabase
        .from('consumable_bundles')
        .select('id, name, description, price')
        .eq('is_active', true)
        .order('price');

      setProducts(mockProducts);
      setIndividualUnits(
        mockIndividualUnits.map(item => ({
          ...item,
          selected: false
        }))
      );
      setConsumables(consumablesData || []);
      setBundles(bundlesData || []);

      // Initialize bulk inventory items if not already set
      if (data.bulkItems.length === 0) {
        const bulkItems = mockProducts.map(product => ({
          id: product.id,
          product_id: product.id,
          name: product.name,
          total_owned: product.stock_total,
          reserved_accepted: 0,
          reserved_pending: 0,
          available: product.stock_total,
          selected_quantity: 0,
          selected_units: []
        }));
        
        onUpdate({ ...data, bulkItems });
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotals = () => {
    // Calculate inventory subtotal (for now, assuming rental pricing)
    const inventorySubtotal = data.bulkItems.reduce((sum, item) => {
      const specificUnitsCount = item.selected_units?.length || 0;
      const bulkQuantity = Math.max(0, item.selected_quantity - specificUnitsCount);
      return sum + (bulkQuantity * 50) + (specificUnitsCount * 50);
    }, 0) + data.selectedUnits.length * 50; // $50 per unit placeholder

    // Calculate consumables subtotal
    let consumablesSubtotal = 0;
    if (data.consumablesBillingMethod === 'per-use') {
      consumablesSubtotal = data.selectedConsumables.reduce((sum, item) => 
        sum + item.line_total, 0
      );
    } else if (data.consumablesBillingMethod === 'bundle' && data.selectedBundle) {
      const bundle = bundles.find(b => b.id === data.selectedBundle);
      consumablesSubtotal = bundle?.price || 0;
    }
    // Subscription has no per-job cost

    onUpdate({
      ...data,
      inventorySubtotal,
      consumablesSubtotal
    });
  };

  const updateBulkItemQuantity = (productId: string, quantity: number) => {
    const updatedItems = data.bulkItems.map(item =>
      item.product_id === productId 
        ? { ...item, selected_quantity: quantity, selected_units: [] }
        : item
    );
    onUpdate({ ...data, bulkItems: updatedItems });
  };

  const updateBulkItemSpecificUnit = (productId: string, unitId: string, selected: boolean) => {
    const updatedItems = data.bulkItems.map(item => {
      if (item.product_id === productId) {
        let updatedUnits = [...(item.selected_units || [])];
        
        if (selected) {
          const unit = individualUnits.find(u => u.id === unitId);
          if (unit && !updatedUnits.find(u => u.id === unitId)) {
            updatedUnits.push({ ...unit, selected: true });
          }
        } else {
          updatedUnits = updatedUnits.filter(u => u.id !== unitId);
        }
        
        return { ...item, selected_units: updatedUnits };
      }
      return item;
    });
    onUpdate({ ...data, bulkItems: updatedItems });
  };

  const toggleIndividualUnit = (unitId: string, selected: boolean) => {
    const updatedUnits = data.selectedUnits.map(unit =>
      unit.id === unitId ? { ...unit, selected } : unit
    );
    
    if (selected && !data.selectedUnits.find(u => u.id === unitId)) {
      const unit = individualUnits.find(u => u.id === unitId);
      if (unit) {
        updatedUnits.push({ ...unit, selected: true });
      }
    }
    
    onUpdate({ 
      ...data, 
      selectedUnits: updatedUnits.filter(u => u.selected)
    });
  };

  const updateConsumableQuantity = (consumableId: string, quantity: number) => {
    const consumable = consumables.find(c => c.id === consumableId);
    if (!consumable) return;

    const existingItem = data.selectedConsumables.find(item => item.id === consumableId);
    let updatedConsumables;

    if (quantity === 0) {
      updatedConsumables = data.selectedConsumables.filter(item => item.id !== consumableId);
    } else if (existingItem) {
      updatedConsumables = data.selectedConsumables.map(item =>
        item.id === consumableId
          ? { 
              ...item, 
              selected_quantity: quantity,
              line_total: quantity * item.unit_price
            }
          : item
      );
    } else {
      const newItem: ConsumableItem = {
        id: consumableId,
        name: consumable.name,
        on_hand_qty: consumable.on_hand_qty,
        unit_price: consumable.unit_price,
        selected_quantity: quantity,
        line_total: quantity * consumable.unit_price,
        locationAllocations: []
      };
      updatedConsumables = [...data.selectedConsumables, newItem];
    }

    onUpdate({ ...data, selectedConsumables: updatedConsumables });
  };

  const updateConsumableLocationAllocations = (consumableId: string, allocations: LocationConsumableAllocation[]) => {
    const updatedConsumables = data.selectedConsumables.map(item =>
      item.id === consumableId
        ? { ...item, locationAllocations: allocations }
        : item
    );
    onUpdate({ ...data, selectedConsumables: updatedConsumables });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnits = individualUnits.filter(unit =>
    unit.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.item_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Inventory & Consumables</h2>
        <p className="text-muted-foreground">Select equipment and consumables for this job</p>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory Allocation</TabsTrigger>
          <TabsTrigger value="consumables">Consumables & Pricing</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bulk Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <List className="w-5 h-5" />
                <span>Bulk Inventory</span>
              </CardTitle>
              <CardDescription>
                Allocate quantities from available inventory pools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="w-24">Total Owned</TableHead>
                      <TableHead className="w-24">Reserved (Accepted)</TableHead>
                      <TableHead className="w-24">Reserved (Pending)</TableHead>
                      <TableHead className="w-24">Available</TableHead>
                      <TableHead className="w-32">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const bulkItem = data.bulkItems.find(item => item.product_id === product.id);
                      const available = bulkItem?.available || 0;
                      const selectedQty = bulkItem?.selected_quantity || 0;
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{bulkItem?.total_owned || 0}</TableCell>
                          <TableCell>{bulkItem?.reserved_accepted || 0}</TableCell>
                          <TableCell>{bulkItem?.reserved_pending || 0}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={available > 0 ? "default" : "destructive"}
                              className={available > 0 ? "bg-green-100 text-green-800" : ""}
                            >
                              {available}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Input
                                type="number"
                                min="0"
                                max={available}
                                value={selectedQty}
                                onChange={(e) => updateBulkItemQuantity(
                                  product.id, 
                                  parseInt(e.target.value) || 0
                                )}
                                className={selectedQty > available ? 'border-destructive' : ''}
                                placeholder="Total quantity"
                              />
                              {selectedQty > 0 && (
                                <div className="border rounded-lg p-2 bg-muted/30">
                                  <div className="text-xs text-muted-foreground mb-2">
                                    Specify individual units (optional):
                                  </div>
                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {individualUnits
                                      .filter(unit => unit.product_id === product.id && unit.status === 'available')
                                      .map((unit) => {
                                        const isSelected = bulkItem?.selected_units?.some(u => u.id === unit.id) || false;
                                        return (
                                          <div key={unit.id} className="flex items-center space-x-2 text-xs">
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={(checked) => 
                                                updateBulkItemSpecificUnit(product.id, unit.id, checked as boolean)
                                              }
                                              disabled={(bulkItem?.selected_units?.length || 0) >= selectedQty && !isSelected}
                                            />
                                            <span className="font-mono">{unit.item_code}</span>
                                            {unit.color && (
                                              <Badge variant="outline" className="text-xs px-1 py-0">
                                                {unit.color}
                                              </Badge>
                                            )}
                                            {unit.winterized && (
                                              <Badge variant="outline" className="text-xs px-1 py-0">
                                                Winter
                                              </Badge>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                  {bulkItem?.selected_units && bulkItem.selected_units.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-2">
                                      {bulkItem.selected_units.length} specific units selected, {Math.max(0, selectedQty - bulkItem.selected_units.length)} from general pool
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Individual Units (not part of bulk) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Grid className="w-5 h-5" />
                    <span>Additional Individual Units</span>
                  </CardTitle>
                  <CardDescription>
                    Select specific units separate from bulk allocations
                  </CardDescription>
                </div>
                <Switch
                  checked={data.selectSpecificUnits}
                  onCheckedChange={(checked) => onUpdate({ 
                    ...data, 
                    selectSpecificUnits: checked,
                    selectedUnits: checked ? data.selectedUnits : []
                  })}
                />
              </div>
            </CardHeader>
            
            {data.selectSpecificUnits && (
              <CardContent>
                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {filteredUnits.map((unit) => {
                    // Check if this unit is already selected in bulk allocations
                    const isInBulk = data.bulkItems.some(item => 
                      item.selected_units?.some(u => u.id === unit.id)
                    );
                    
                    return (
                      <div
                        key={unit.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 border border-border rounded-lg",
                          isInBulk && "opacity-50"
                        )}
                      >
                        <Checkbox
                          checked={data.selectedUnits.some(u => u.id === unit.id)}
                          onCheckedChange={(checked) => 
                            toggleIndividualUnit(unit.id, checked as boolean)
                          }
                          disabled={isInBulk}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{unit.item_code}</span>
                            <Badge variant="outline">{unit.product_name}</Badge>
                            <Badge 
                              className={unit.status === 'available' 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                              }
                            >
                              {unit.status}
                            </Badge>
                            {isInBulk && (
                              <Badge variant="secondary" className="text-xs">
                                In Bulk
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {[unit.color, unit.size, unit.condition, unit.winterized ? 'Winterized' : null]
                              .filter(Boolean)
                              .join(' • ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Consumables Tab */}
        <TabsContent value="consumables" className="space-y-6">
          {/* Add Consumables Toggle */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Add Consumables</CardTitle>
                  <CardDescription>
                    Include consumable items with billing options
                  </CardDescription>
                </div>
                <Switch
                  checked={data.addConsumables}
                  onCheckedChange={(checked) => onUpdate({ ...data, addConsumables: checked })}
                />
              </div>
            </CardHeader>
          </Card>

          {data.addConsumables && (
            <Tabs value={data.consumablesBillingMethod} 
                  onValueChange={(method) => onUpdate({ 
                    ...data, 
                    consumablesBillingMethod: method as 'per-use' | 'bundle' | 'subscription'
                  })}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="per-use">Per-Use Add-On</TabsTrigger>
                <TabsTrigger value="bundle">Bundle Pricing</TabsTrigger>
                <TabsTrigger value="subscription">Flat-Rate Subscription</TabsTrigger>
              </TabsList>

              <TabsContent value="per-use" className="space-y-4">
                <div className="grid gap-4">
                  {consumables.map((consumable) => {
                    const selectedItem = data.selectedConsumables.find(item => item.id === consumable.id);
                    const quantity = selectedItem?.selected_quantity || 0;
                    
                    return (
                      <div key={consumable.id} className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{consumable.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Stock: {consumable.on_hand_qty} • ${consumable.unit_price.toFixed(2)}/unit
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              min="0"
                              max={consumable.on_hand_qty}
                              value={quantity}
                              onChange={(e) => updateConsumableQuantity(
                                consumable.id, 
                                parseInt(e.target.value) || 0
                              )}
                              className="w-20"
                            />
                            {quantity > 0 && (
                              <Badge>${(quantity * consumable.unit_price).toFixed(2)}</Badge>
                            )}
                          </div>
                        </div>
                        
                        {quantity > 0 && (
                          <JobConsumableLocationPicker
                            consumableId={consumable.id}
                            consumableName={consumable.name}
                            totalQuantityNeeded={quantity}
                            onAllocationChange={(allocations) => 
                              updateConsumableLocationAllocations(consumable.id, allocations)
                            }
                            value={selectedItem?.locationAllocations || []}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="bundle" className="space-y-4">
                <div className="grid gap-3">
                  {bundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className={cn(
                        "p-4 border-2 rounded-lg cursor-pointer transition-all duration-200",
                        data.selectedBundle === bundle.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => onUpdate({ 
                        ...data, 
                        selectedBundle: bundle.id === data.selectedBundle ? null : bundle.id 
                      })}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{bundle.name}</div>
                          <div className="text-sm text-muted-foreground">{bundle.description}</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          ${bundle.price.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="subscription" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Unlimited Consumables Plan</CardTitle>
                        <CardDescription>
                          No per-job billing for consumables (tracked internally only)
                        </CardDescription>
                      </div>
                      <Switch
                        checked={data.subscriptionEnabled}
                        onCheckedChange={(checked) => onUpdate({ 
                          ...data, 
                          subscriptionEnabled: checked 
                        })}
                      />
                    </div>
                  </CardHeader>
                  {data.subscriptionEnabled && (
                    <CardContent>
                      <Badge className="bg-purple-100 text-purple-800">
                        $200/month - Unlimited consumables
                      </Badge>
                    </CardContent>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>

      {/* Subtotals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Inventory Subtotal</span>
              <span>${data.inventorySubtotal.toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        
        {data.addConsumables && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Consumables Subtotal</span>
                <span>${data.consumablesSubtotal.toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
};