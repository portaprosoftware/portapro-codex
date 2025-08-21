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
  
  // State for readable names
  const [customerName, setCustomerName] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [vehicleDetails, setVehicleDetails] = useState<string>('');
  const [productDetails, setProductDetails] = useState<Record<string, { name: string; price_per_day: number }>>({});

  const startDate = d.scheduled_date || '';
  const endDate = d.return_date || d.scheduled_date || '';
  const servicesData = d.servicesData as any | undefined;
  const services = servicesData?.selectedServices || [];
  const servicesSubtotal = Number(servicesData?.servicesSubtotal || 0);

  const items = useMemo(() => d.items || [], [d.items]);

  // Auto-enable daily assignments when both driver and vehicle are present
  useEffect(() => {
    if (d.driver_id && d.vehicle_id && !d.create_daily_assignment) {
      updateData({ create_daily_assignment: true });
    }
  }, [d.driver_id, d.vehicle_id, d.create_daily_assignment, updateData]);

  // Fetch readable names and product details
  useEffect(() => {
    const fetchNames = async () => {
      // Fetch customer name
      if (d.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', d.customer_id)
          .maybeSingle();
        setCustomerName(customer?.name || 'Unknown Customer');
      }

      // Fetch driver name
      if (d.driver_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('clerk_user_id', d.driver_id)
          .maybeSingle();
        if (profile && (profile.first_name || profile.last_name)) {
          setDriverName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
        } else {
          setDriverName('Unknown Driver');
        }
      }

      // Fetch vehicle details
      if (d.vehicle_id) {
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('year, make, model, license_plate')
          .eq('id', d.vehicle_id)
          .maybeSingle();
        if (vehicle) {
          setVehicleDetails(`${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.license_plate || 'No Plate'})`.trim());
        }
      }

      // Fetch product details for items
      if (items.length > 0) {
        const productIds = [...new Set(items.map(item => item.product_id))];
        const { data: products } = await supabase
          .from('products')
          .select('id, name, default_price_per_day')
          .in('id', productIds);
        
        if (products) {
          const productMap: Record<string, { name: string; price_per_day: number }> = {};
          products.forEach(product => {
            productMap[product.id] = {
              name: product.name,
              price_per_day: Number(product.default_price_per_day || 0)
            };
          });
          setProductDetails(productMap);
        }
      }
    };

    fetchNames();
  }, [d.customer_id, d.driver_id, d.vehicle_id, items]);
  
  // Calculate rental period in days
  const rentalDays = useMemo(() => {
    if (!startDate) return 1;
    if (!endDate || endDate === startDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
  }, [startDate, endDate]);

  // Format currency with commas
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate items total
  const itemsTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const product = productDetails[item.product_id];
      if (product) {
        return total + (product.price_per_day * item.quantity * rentalDays);
      }
      return total;
    }, 0);
  }, [items, productDetails, rentalDays]);

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
          <div>Customer: {customerName || d.customer_id || '—'}</div>
          <div>Type: {d.job_type || '—'}</div>
          <div>Date: {d.scheduled_date || '—'}{d.return_date ? ` → ${d.return_date}` : ''}</div>
          <div>Time: {d.scheduled_time || '—'} ({d.timezone})</div>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <h3 className="font-medium">Assignments</h3>
          <div>Driver: {driverName || 'No driver assigned'}</div>
          {driverConflict && <div className="text-xs text-red-600">{driverConflict}</div>}
          <div>Vehicle: {vehicleDetails || d.vehicle_id || '—'}</div>
          {vehicleConflict && <div className="text-xs text-red-600">{vehicleConflict}</div>}
        </div>
        <div className="rounded-lg border p-3 space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Items</h3>
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium">Subtotal: {formatCurrency(itemsTotal)}</div>
              {checking && <div className="text-xs text-muted-foreground">Checking…</div>}
              {!checking && hasConflicts && <div className="text-xs text-red-600">Conflicts detected</div>}
            </div>
          </div>
          {d.items && d.items.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {d.items.map((it, i) => {
                const conflict = itemConflicts.find((c) => c.product_id === it.product_id && c.type === it.strategy);
                const product = productDetails[it.product_id];
                const productName = product?.name || it.product_id;
                const pricePerDay = product?.price_per_day || 0;
                const itemCost = pricePerDay * it.quantity * rentalDays;
                return (
                  <li key={i}>
                    <span className="font-medium">{productName}</span> × {it.quantity} × {rentalDays} day{rentalDays !== 1 ? 's' : ''} = {formatCurrency(itemCost)}
                    {it.specific_item_ids && it.specific_item_ids.length > 0 && (
                      <div className="text-xs text-muted-foreground ml-4">Units: {it.specific_item_ids.join(', ')}</div>
                    )}
                    {conflict && (
                      <div className="text-xs text-red-600 ml-4">{conflict.message}</div>
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
            <div className="text-xs font-medium">Subtotal: {formatCurrency(servicesSubtotal)}</div>
          </div>
          {services.length > 0 ? (
            <div className="space-y-3">
              <ul className="list-disc list-inside space-y-1">
                {services.map((s: any, i: number) => (
                  <li key={s.id || i}>
                    <span className="font-medium">{s.name || s.service_code || 'Service'}</span> · {getFrequencyLabel(s)} · {formatCurrency(Number(s.calculated_cost || 0))}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground">No services selected</p>
          )}
        </div>
      </div>

      {/* Job Total */}
      {jobTotal > 0 && (
        <div className="border-t pt-4 space-y-2">
          {itemsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Items:</span>
              <span>{formatCurrency(itemsTotal)}</span>
            </div>
          )}
          {servicesSubtotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Services:</span>
              <span>{formatCurrency(servicesSubtotal)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
            <span>Job Total:</span>
            <span>{formatCurrency(jobTotal)}</span>
          </div>
        </div>
      )}

    </div>
  );
};
