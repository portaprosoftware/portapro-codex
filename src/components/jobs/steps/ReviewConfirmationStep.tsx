import React, { useEffect, useMemo, useState } from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface ReviewConfirmationStepProps {
  onCreateJob: () => void;
  creating?: boolean;
}

interface ItemConflict {
  product_id: string;
  type: 'bulk' | 'specific';
  message: string;
}

export const ReviewConfirmationStep: React.FC<ReviewConfirmationStepProps> = ({ onCreateJob, creating }) => {
  const { state, updateData } = useJobWizard();
  const d = state.data;
  const [checking, setChecking] = useState(false);
  const [itemConflicts, setItemConflicts] = useState<ItemConflict[]>([]);
  const [driverConflict, setDriverConflict] = useState<string | null>(null);
  const [vehicleConflict, setVehicleConflict] = useState<string | null>(null);

  const startDate = d.scheduled_date || '';
  const endDate = d.return_date || d.scheduled_date || '';
  const servicesData = d.servicesData as any | undefined;
  const services = servicesData?.selectedServices || [];
  const servicesSubtotal = Number(servicesData?.servicesSubtotal || 0);

  const items = useMemo(() => d.items || [], [d.items]);
  const itemsTotal = 0; // Items don't have pricing in the wizard, just services
  const jobTotal = itemsTotal + servicesSubtotal;

  useEffect(() => {
    const runChecks = async () => {
      if (!startDate) return;
      setChecking(true);
      setItemConflicts([]);
      setDriverConflict(null);
      setVehicleConflict(null);
      try {
        // 1) Items availability
        const newConflicts: ItemConflict[] = [];
        for (const it of items) {
          if (it.strategy === 'bulk') {
            const { data, error } = await supabase.rpc('get_product_availability_enhanced', {
              product_type_id: it.product_id,
              start_date: startDate,
              end_date: endDate,
              filter_attributes: it.attributes || null,
            });
            if (!error) {
              const avail: any = data || {};
              const available = Number(avail.available || 0);
              if (available < it.quantity) {
                newConflicts.push({ product_id: it.product_id, type: 'bulk', message: `Only ${available} available; requested ${it.quantity}` });
              }
            }
          } else if (it.strategy === 'specific' && it.specific_item_ids?.length) {
            const { data, error } = await supabase.rpc('get_available_units', {
              product_type_id: it.product_id,
              start_date: startDate,
              end_date: endDate,
            });
            if (!error) {
              const availableIds = new Set((data as any[])?.map((u) => u.item_id) || []);
              const missing = it.specific_item_ids.filter((id) => !availableIds.has(id));
              if (missing.length > 0) {
                newConflicts.push({ product_id: it.product_id, type: 'specific', message: `Units not available: ${missing.join(', ')}` });
              }
            }
          }
        }

        setItemConflicts(newConflicts);

        // 2) Driver availability (daily)
        if (d.driver_id) {
          const { data: driverAssignment, error } = await supabase
            .from('daily_vehicle_assignments')
            .select('id')
            .eq('assignment_date', startDate)
            .eq('driver_id', d.driver_id)
            .maybeSingle();
          if (!error && driverAssignment) {
            setDriverConflict('Driver already has a daily assignment for this date.');
          }
        }

        // 3) Vehicle availability (daily)
        if (d.vehicle_id) {
          const { data: vehicleAssignment, error } = await supabase
            .from('daily_vehicle_assignments')
            .select('id')
            .eq('assignment_date', startDate)
            .eq('vehicle_id', d.vehicle_id)
            .maybeSingle();
          if (!error && vehicleAssignment) {
            setVehicleConflict('Vehicle is already assigned for this date.');
          }
        }
      } finally {
        setChecking(false);
      }
    };

    runChecks();
    // Re-check on date, items, driver/vehicle changes
  }, [startDate, endDate, JSON.stringify(items), d.driver_id, d.vehicle_id]);

  const hasConflicts = itemConflicts.length > 0 || !!driverConflict || !!vehicleConflict;

  const getFrequencyLabel = (s: any) => {
    switch (s?.frequency) {
      case 'one-time':
        return 'One-Time';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        if (s?.custom_type === 'days_interval') return `Every ${s?.custom_frequency_days || 1} days`;
        if (s?.custom_type === 'days_of_week') return (s?.custom_days_of_week?.join(', ') || 'Custom days');
        if (s?.custom_type === 'specific_dates') return `${s?.custom_specific_dates?.length || 0} dates`;
        return 'Custom';
      default:
        return 'One-Time';
    }
  };
  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted-foreground">We’ll validate availability before creating the job.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border p-3 space-y-1">
          <h3 className="font-medium">Basics</h3>
          <div>Customer: <span className="font-mono text-xs">{d.customer_id || '—'}</span></div>
          <div>Type: {d.job_type || '—'}</div>
          <div>Date: {d.scheduled_date || '—'}{d.return_date ? ` → ${d.return_date}` : ''}</div>
          <div>Time: {d.scheduled_time || '—'} ({d.timezone})</div>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <h3 className="font-medium">Assignments</h3>
          <div>Driver: <span className="font-mono text-xs">{d.driver_id || '—'}</span></div>
          {driverConflict && <div className="text-xs text-red-600">{driverConflict}</div>}
          <div>Vehicle: <span className="font-mono text-xs">{d.vehicle_id || '—'}</span></div>
          {vehicleConflict && <div className="text-xs text-red-600">{vehicleConflict}</div>}
        </div>
        <div className="rounded-lg border p-3 space-y-1 md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!d.create_daily_assignment}
              onChange={(e) => updateData({ create_daily_assignment: e.currentTarget.checked })}
              disabled={!d.driver_id || !d.vehicle_id || !!driverConflict || !!vehicleConflict}
            />
            <span>Create daily driver + vehicle assignment for {startDate || 'selected date'}</span>
          </label>
          <p className="text-xs text-muted-foreground">Prevents double-booking and helps track mileage.</p>
        </div>
        <div className="rounded-lg border p-3 space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Items</h3>
            <div className="text-xs text-muted-foreground">{checking ? 'Checking…' : hasConflicts ? 'Conflicts detected' : 'All clear'}</div>
          </div>
          {d.items && d.items.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {d.items.map((it, i) => {
                const conflict = itemConflicts.find((c) => c.product_id === it.product_id && c.type === it.strategy);
                return (
                  <li key={i}>
                    <span className="font-mono text-xs">{it.product_id}</span> · qty {it.quantity} · {it.strategy}
                    {it.specific_item_ids && it.specific_item_ids.length > 0 && (
                      <> · items: {it.specific_item_ids.join(', ')}</>
                    )}
                    {conflict && (
                      <div className="text-xs text-red-600">{conflict.message}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No items selected</p>
          )}
        </div>

        <div className="rounded-lg border p-3 space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Services</h3>
            <div className="text-xs font-medium">Subtotal: ${servicesSubtotal.toFixed(2)}</div>
          </div>
          {services.length > 0 ? (
            <div className="space-y-3">
              <ul className="list-disc list-inside space-y-1">
                {services.map((s: any, i: number) => (
                  <li key={s.id || i}>
                    <span className="font-medium">{s.name || s.service_code || 'Service'}</span> · {getFrequencyLabel(s)} · ${Number(s.calculated_cost || 0).toFixed(2)}
                  </li>
                ))}
              </ul>
              {services.some((s: any) => s.frequency !== 'one-time') && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <strong>Schedule Preview:</strong> Recurring services will be automatically scheduled based on their frequency after initial job completion.
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No services selected</p>
          )}
        </div>
      </div>

      {/* Job Total */}
      {jobTotal > 0 && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Job Total:</span>
            <span>${jobTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" disabled={checking} onClick={() => {
          // Force re-run by toggling dependencies via state copy
          const evt = new Event('recheck');
          window.dispatchEvent(evt);
        }}>Recheck</Button>
        <Button onClick={onCreateJob} disabled={!!creating || checking || hasConflicts} className="min-w-[140px]">
          {creating ? 'Creating…' : 'Create Job'}
        </Button>
      </div>
    </div>
  );
};
