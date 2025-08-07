import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAvailabilityEngine } from '@/hooks/useAvailabilityEngine';
import type { JobItemSelection } from '@/contexts/JobWizardContext';

interface RealTimeInventorySelectorProps {
  startDate: string;
  endDate?: string | null;
  value?: JobItemSelection[];
  onChange?: (items: JobItemSelection[]) => void;
}

export const RealTimeInventorySelector: React.FC<RealTimeInventorySelectorProps> = ({
  startDate,
  endDate,
  value = [],
  onChange,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [qty, setQty] = useState<number>(1);

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'for-availability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_total')
        .order('name');
      if (error) throw error;
      return data as { id: string; name: string; stock_total: number }[];
    },
  });

  const availability = useAvailabilityEngine(selectedProduct, startDate, endDate || undefined);

  const selected = useMemo(() => value, [value]);

  const addItem = () => {
    if (!selectedProduct || qty <= 0) return;
    const next: JobItemSelection[] = [...selected];
    const idx = next.findIndex((i) => i.product_id === selectedProduct && i.strategy === 'bulk');
    if (idx >= 0) next[idx] = { ...next[idx], quantity: qty };
    else next.push({ product_id: selectedProduct, quantity: qty, strategy: 'bulk' });
    onChange?.(next);
  };

  const removeItem = (product_id: string) => {
    const next = selected.filter((i) => i.product_id !== product_id);
    onChange?.(next);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Product</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min={1}
            max={availability.data?.available || undefined}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value || '1', 10))}
          />
        </div>
      </div>

      {selectedProduct && (
        <Card>
          <CardContent className="py-4 text-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="font-medium">Availability:</span>{' '}
                {availability.isLoading ? 'Loading…' : `${availability.data?.available ?? 0} of ${availability.data?.total ?? 0}`}
              </div>
              <div className="text-muted-foreground">Method: {availability.data?.method || '—'}</div>
              <div className="ml-auto">
                <Button onClick={addItem} disabled={!availability.data || qty <= 0 || qty > (availability.data?.available ?? 0)}>
                  Add to Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-2">
        <h3 className="font-medium">Selected Items</h3>
        {selected.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items selected.</p>
        ) : (
          <div className="space-y-2">
            {selected.map((it) => (
              <div key={`${it.product_id}-${it.strategy}`} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                <div className="flex-1">
                  <div className="font-mono text-xs">{it.product_id}</div>
                  <div>qty {it.quantity} · {it.strategy}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeItem(it.product_id)}>Remove</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="text-xs text-muted-foreground">
        Selecting specific units by attributes will be added next. This selector prevents overbooking by enforcing current availability.
      </aside>
    </div>
  );
};
