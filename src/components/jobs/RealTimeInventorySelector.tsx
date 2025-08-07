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

interface AvailableUnit {
  item_id: string;
  item_code: string;
  status: string;
  location?: any;
}

export const RealTimeInventorySelector: React.FC<RealTimeInventorySelectorProps> = ({
  startDate,
  endDate,
  value = [],
  onChange,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [mode, setMode] = useState<'bulk' | 'specific'>('bulk');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  // Attribute filters
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');

  const hasFilters = useMemo(() => !!(color || size), [color, size]);
  const filterAttributes = useMemo(() => (
    hasFilters ? { color: color || undefined, size: size || undefined } : null
  ), [hasFilters, color, size]);

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

  const availability = useAvailabilityEngine(selectedProduct, startDate, endDate || undefined, filterAttributes);

  const { data: availableUnits = [], isLoading: loadingUnits } = useQuery<AvailableUnit[]>({
    queryKey: ['available-units', selectedProduct, startDate, endDate || startDate],
    queryFn: async () => {
      if (!selectedProduct) return [];
      const { data, error } = await supabase.rpc('get_available_units', {
        product_type_id: selectedProduct,
        start_date: startDate,
        end_date: endDate || startDate,
      });
      if (error) throw error;
      return (data as any[])?.map((u) => ({
        item_id: u.item_id,
        item_code: u.item_code,
        status: u.status,
        location: u.location,
      })) || [];
    },
    enabled: !!selectedProduct && mode === 'specific' && !hasFilters,
  });

  const filteredUnits = useMemo(() => {
    if (!hasFilters) return [];
    return availability.data?.individual_items?.map((u: any) => ({
      item_id: u.item_id,
      item_code: u.item_code,
      status: u.status,
    })) || [];
  }, [hasFilters, availability.data]);

  const unitsList = hasFilters ? filteredUnits : availableUnits;
  const unitsLoading = hasFilters ? availability.isLoading : loadingUnits;

  const selected = useMemo(() => value, [value]);

  const upsertBulk = () => {
    if (!selectedProduct || qty <= 0) return;
    const next: JobItemSelection[] = [...selected];
    const idx = next.findIndex((i) => i.product_id === selectedProduct && i.strategy === 'bulk');
    if (idx >= 0) next[idx] = { ...next[idx], quantity: qty };
    else next.push({ product_id: selectedProduct, quantity: qty, strategy: 'bulk', attributes: hasFilters ? { color, size } : undefined });
    onChange?.(next);
  };

  const upsertSpecific = () => {
    const clean = selectedUnitIds.filter(Boolean);
    if (!selectedProduct || clean.length === 0) return;

    const next: JobItemSelection[] = [...selected];
    const idx = next.findIndex((i) => i.product_id === selectedProduct && i.strategy === 'specific');
    const payload: JobItemSelection = {
      product_id: selectedProduct,
      quantity: clean.length,
      strategy: 'specific',
      specific_item_ids: clean,
      attributes: hasFilters ? { color, size } : undefined,
    };
    if (idx >= 0) next[idx] = payload; else next.push(payload);
    onChange?.(next);
  };

  const removeItem = (product_id: string, strategy: 'bulk' | 'specific') => {
    const next = selected.filter((i) => !(i.product_id === product_id && i.strategy === strategy));
    onChange?.(next);
  };

  const toggleUnit = (id: string) => {
    setSelectedUnitIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setColor('');
    setSize('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label>Product</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setSelectedUnitIds([]);
            }}
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Mode</Label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as 'bulk' | 'specific');
              setSelectedUnitIds([]);
            }}
          >
            <option value="bulk">Bulk (quantity)</option>
            <option value="specific">Specific items</option>
          </select>
        </div>
      </div>

      {/* Attribute Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" placeholder="e.g., blue" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input id="size" placeholder="e.g., standard" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Button variant="outline" onClick={clearFilters} disabled={!hasFilters}>Clear Filters</Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Filters apply to availability and specific item lists when set.</p>
        </CardContent>
      </Card>

      {/* Bulk Mode */}
      {mode === 'bulk' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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

            {selectedProduct && (
              <div className="md:col-span-2">
                <Card>
                  <CardContent className="py-4 text-sm">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <span className="font-medium">Availability:</span>{' '}
                        {availability.isLoading ? 'Loading…' : `${availability.data?.available ?? 0} of ${availability.data?.total ?? 0}`}
                      </div>
                      <div className="text-muted-foreground">Method: {availability.data?.method || '—'}</div>
                      <div className="ml-auto">
                        <Button onClick={upsertBulk} disabled={!availability.data || qty <= 0 || qty > (availability.data?.available ?? 0)}>
                          Add/Update
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      )}

      {/* Specific Mode */}
      {mode === 'specific' && selectedProduct && (
        <Card>
          <CardContent className="py-4 text-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Available units for selected date range</div>
              <div className="text-xs text-muted-foreground">{unitsLoading ? 'Loading…' : `${unitsList.length} available`}</div>
            </div>

            <div className="max-h-64 overflow-auto border rounded-md">
              {unitsLoading ? (
                <div className="p-4">Loading…</div>
              ) : unitsList.length === 0 ? (
                <div className="p-4 text-muted-foreground">No specific units available for these dates.</div>
              ) : (
                <ul className="divide-y">
                  {unitsList.map((u) => (
                    <li key={u.item_id} className="flex items-center gap-3 p-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectedUnitIds.includes(u.item_id)}
                        onChange={() => toggleUnit(u.item_id)}
                      />
                      <div className="flex-1">
                        <div className="font-mono text-xs">{u.item_code}</div>
                        <div className="text-xs text-muted-foreground">{u.status}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedUnitIds([])} disabled={selectedUnitIds.length === 0}>Clear</Button>
              <Button onClick={upsertSpecific} disabled={selectedUnitIds.length === 0}>Add Selected</Button>
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
                  {it.specific_item_ids && it.specific_item_ids.length > 0 && (
                    <div className="text-xs text-muted-foreground">items: {it.specific_item_ids.join(', ')}</div>
                  )}
                  {it.attributes && (
                    <div className="text-xs text-muted-foreground">filters: {it.attributes.color || '—'} {it.attributes.size ? `· ${it.attributes.size}` : ''}</div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => removeItem(it.product_id, it.strategy)}>Remove</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="text-xs text-muted-foreground">
        Attribute filters are optional and apply to both counts and specific units when set.
      </aside>
    </div>
  );
};
