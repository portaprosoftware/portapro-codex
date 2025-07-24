import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, Trash2, Package, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConsumableItem {
  id: string;
  consumableId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  stockAvailable: number;
}

interface ConsumableBundle {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface ConsumablesPricingData {
  billingMethod: 'per-use' | 'bundle' | 'subscription';
  items: ConsumableItem[];
  selectedBundle: string | null;
  subscriptionEnabled: boolean;
  subtotal: number;
}

interface ConsumablesPricingStepProps {
  data: ConsumablesPricingData;
  onUpdate: (data: ConsumablesPricingData) => void;
}

export const ConsumablesPricingStep: React.FC<ConsumablesPricingStepProps> = ({
  data,
  onUpdate
}) => {
  const [consumables, setConsumables] = useState<any[]>([]);
  const [bundles, setBundles] = useState<ConsumableBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);

  useEffect(() => {
    fetchConsumables();
    fetchBundles();
  }, []);

  useEffect(() => {
    calculateSubtotal();
    validateStock();
  }, [data.items, data.billingMethod, data.selectedBundle]);

  const fetchConsumables = async () => {
    try {
      const { data: consumablesData, error } = await supabase
        .from('consumables')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setConsumables(consumablesData || []);
    } catch (error) {
      console.error('Error fetching consumables:', error);
    }
  };

  const fetchBundles = async () => {
    try {
      const { data: bundlesData, error } = await supabase
        .from('consumable_bundles')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setBundles(bundlesData || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    let subtotal = 0;
    
    if (data.billingMethod === 'per-use') {
      subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    } else if (data.billingMethod === 'bundle' && data.selectedBundle) {
      const bundle = bundles.find(b => b.id === data.selectedBundle);
      subtotal = bundle?.price || 0;
    }
    // Subscription has no subtotal (unlimited plan)

    onUpdate({ ...data, subtotal });
  };

  const validateStock = () => {
    const warnings: string[] = [];
    
    data.items.forEach(item => {
      if (item.quantity > item.stockAvailable) {
        warnings.push(`${item.name} - Requested: ${item.quantity}, Available: ${item.stockAvailable}`);
      }
    });
    
    setStockWarnings(warnings);
  };

  const addConsumableRow = () => {
    const newItem: ConsumableItem = {
      id: crypto.randomUUID(),
      consumableId: '',
      name: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      stockAvailable: 0
    };

    onUpdate({
      ...data,
      items: [...data.items, newItem]
    });
  };

  const updateConsumableRow = (id: string, field: keyof ConsumableItem, value: any) => {
    const updatedItems = data.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'consumableId') {
          const consumable = consumables.find(c => c.id === value);
          if (consumable) {
            updatedItem.name = consumable.name;
            updatedItem.unitPrice = consumable.unit_price;
            updatedItem.stockAvailable = consumable.on_hand_qty;
          }
        }
        
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    });

    onUpdate({ ...data, items: updatedItems });
  };

  const removeConsumableRow = (id: string) => {
    onUpdate({
      ...data,
      items: data.items.filter(item => item.id !== id)
    });
  };

  const handleBillingMethodChange = (method: 'per-use' | 'bundle' | 'subscription') => {
    onUpdate({
      ...data,
      billingMethod: method,
      selectedBundle: method === 'bundle' ? data.selectedBundle : null,
      subscriptionEnabled: method === 'subscription' ? data.subscriptionEnabled : false
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading consumables...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Consumables & Pricing</h2>
        <p className="text-gray-600">Choose how you'd like to bill for any consumable items used on this job</p>
      </div>

      <Tabs value={data.billingMethod} onValueChange={handleBillingMethodChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="per-use">Per-Use Add-On</TabsTrigger>
          <TabsTrigger value="bundle">Bundle Pricing</TabsTrigger>
          <TabsTrigger value="subscription">Flat-Rate Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="per-use" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-32">Unit Price</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No items added. Click "Add Another Consumable" to get started.
                    </TableCell>
                  </TableRow>
                )}
                {data.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select
                        value={item.consumableId}
                        onValueChange={(value) => updateConsumableRow(item.id, 'consumableId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {consumables.map((consumable) => (
                            <SelectItem key={consumable.id} value={consumable.id}>
                              {consumable.name} (Stock: {consumable.on_hand_qty})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateConsumableRow(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className={item.quantity > item.stockAvailable ? 'border-red-500' : ''}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateConsumableRow(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${item.total.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConsumableRow(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            variant="outline"
            onClick={addConsumableRow}
            className="w-full border-dashed border-2 border-gray-300 hover:border-[#3366FF] hover:bg-blue-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Consumable
          </Button>

          {data.subtotal > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Subtotal:</span>
                <span className="text-xl font-bold text-[#3366FF]">${data.subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bundle" className="space-y-4">
          <RadioGroup
            value={data.selectedBundle || ''}
            onValueChange={(value) => onUpdate({ ...data, selectedBundle: value })}
          >
            {bundles.map((bundle) => (
              <div key={bundle.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={bundle.id} id={bundle.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={bundle.id} className="font-medium text-gray-900">
                      {bundle.name}
                    </Label>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                      ${bundle.price}/visit
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>

          {data.selectedBundle && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Bundle Total:</span>
                <span className="text-xl font-bold text-[#3366FF]">${data.subtotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-2">
                  Unlimited Consumables Subscription
                </h3>
                <p className="text-sm text-gray-600">
                  No line-item billing—consumable usage will be tracked internally only.
                </p>
                <div className="mt-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    $200/month
                  </Badge>
                </div>
              </div>
              <Switch
                checked={data.subscriptionEnabled}
                onCheckedChange={(checked) => onUpdate({ ...data, subscriptionEnabled: checked })}
              />
            </div>
          </div>

          {data.subscriptionEnabled && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-900">
                  Unlimited consumables plan active - no per-job charges
                </span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stock Warnings */}
      {stockWarnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900 mb-2">Stock Warnings</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                {stockWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};