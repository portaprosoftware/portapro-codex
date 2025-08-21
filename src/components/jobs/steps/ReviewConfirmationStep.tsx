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

        {/* Service Assignment Schedule */}
        {services.length > 0 && (
          <div className="rounded-lg border p-3 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Service Assignment Schedule</h3>
              <div className="text-xs text-muted-foreground">
                {servicesData?.groupAssignmentsByDay ? 'Grouped by day' : 'Individual assignments'}
              </div>
            </div>
            
            {servicesData?.groupAssignmentsByDay && servicesData?.dayAssignments ? (
              // Day-based assignments
              <div className="space-y-3">
                {Object.entries(servicesData.dayAssignments).map(([dateKey, assignment]) => (
                  <div key={dateKey} className="border rounded-lg p-3 space-y-2">
                    <div className="font-medium text-sm">{new Date(dateKey).toLocaleDateString()}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span>{(assignment as any)?.driver?.name || 'No driver assigned'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span>{(assignment as any)?.vehicle?.display_name || 'No vehicle assigned'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : servicesData?.individualServiceAssignments ? (
              // Individual service assignments
              <div className="space-y-3">
                {services.map((service: any) => {
                  const serviceAssignments = servicesData.individualServiceAssignments?.[service.id] || {};
                  return (
                    <div key={service.id} className="border rounded-lg p-3 space-y-2">
                      <div className="font-medium text-sm">{service.name || service.service_code}</div>
                      {Object.entries(serviceAssignments).map(([dateKey, assignment]: [string, any]) => (
                        <div key={dateKey} className="pl-4 border-l-2 border-muted space-y-1">
                          <div className="text-xs text-muted-foreground">{new Date(dateKey).toLocaleDateString()}</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <span className="text-xs">{assignment.driver?.name || 'No driver'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              </div>
                              <span className="text-xs">{assignment.vehicle?.display_name || 'No vehicle'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : servicesData?.scheduledDriverForAll || servicesData?.scheduledVehicleForAll ? (
              // Global assignments for all services
              <div className="border rounded-lg p-3 space-y-2">
                <div className="font-medium text-sm">All Services</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span>{servicesData.scheduledDriverForAll?.name || 'No driver assigned'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span>{servicesData.scheduledVehicleForAll?.display_name || 'No vehicle assigned'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No service assignments configured</div>
            )}
          </div>
        )}

        {/* Job Assignments */}
        {(driverName || vehicleDetails) && (
          <div className="rounded-lg border p-3 space-y-2 md:col-span-2">
            <h3 className="font-medium">Job Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Driver</div>
                {driverName && driverName !== 'No driver assigned' ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-xs">
                        {driverName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{driverName}</p>
                        <p className="text-xs text-muted-foreground">Assigned</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">No driver assigned</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Vehicle</div>
                {vehicleDetails ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{vehicleDetails}</p>
                        <p className="text-xs text-muted-foreground">Assigned</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">No vehicle assigned</p>
                  </div>
                )}
              </div>
            </div>
            {d.create_daily_assignment && (
              <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                <strong>Note:</strong> Daily driver and vehicle assignment will be created automatically for this job date.
              </div>
            )}
          </div>
        )}
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
