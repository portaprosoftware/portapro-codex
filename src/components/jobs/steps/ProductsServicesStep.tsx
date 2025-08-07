import React, { useState } from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const ProductsServicesStep: React.FC = () => {
  const { state, updateData } = useJobWizard();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [strategy, setStrategy] = useState<'bulk' | 'specific'>('bulk');
  const [specificIds, setSpecificIds] = useState('');

  const addOrUpdateItem = () => {
    if (!productId || quantity <= 0) return;

    const newItem = {
      product_id: productId,
      quantity,
      strategy,
      specific_item_ids: strategy === 'specific'
        ? specificIds.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
    } as const;

    updateData({ items: [newItem] });
  };

  const clearItems = () => updateData({ items: [] });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Select Products/Units</h2>
        <p className="text-sm text-muted-foreground">
          Temporary input-based selector. We’ll replace with the RealTimeInventorySelector next.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-id">Product ID</Label>
          <Input id="product-id" placeholder="uuid of product" value={productId} onChange={(e) => setProductId(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value || '1', 10))} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="strategy">Reservation Strategy</Label>
          <select
            id="strategy"
            className="h-10 rounded-md border px-3 bg-background"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as 'bulk' | 'specific')}
          >
            <option value="bulk">Bulk (quantity)</option>
            <option value="specific">Specific items</option>
          </select>
        </div>

        {strategy === 'specific' && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="specific-ids">Specific Item IDs (comma-separated)</Label>
            <Textarea id="specific-ids" placeholder="uuid1, uuid2, uuid3" value={specificIds} onChange={(e) => setSpecificIds(e.target.value)} rows={2} />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={addOrUpdateItem}>Save Selection</Button>
        <Button variant="outline" onClick={clearItems}>Clear</Button>
      </div>

      <section className="space-y-2">
        <h3 className="font-medium">Current Selection</h3>
        {state.data.items && state.data.items.length > 0 ? (
          <div className="rounded-md border p-3 text-sm">
            {state.data.items.map((it, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div>Product: <span className="font-mono text-xs">{it.product_id}</span></div>
                <div>Qty: {it.quantity} | Strategy: {it.strategy}</div>
                {it.specific_item_ids && it.specific_item_ids.length > 0 && (
                  <div>Items: {it.specific_item_ids.join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No items selected.</p>
        )}
      </section>

      <aside className="text-xs text-muted-foreground">
        Availability will be validated again on review and during submission to prevent conflicts.
      </aside>
    </div>
  );
};
