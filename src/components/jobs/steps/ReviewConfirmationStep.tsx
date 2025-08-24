import React, { useEffect, useMemo, useState } from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, BriefcaseIcon, Package, Receipt } from 'lucide-react';

interface ReviewConfirmationStepProps {
  onCreateJob: () => void;
  onCreateQuote: () => void;
  onCreateJobAndQuote: () => void;
  onCreateInvoice?: () => void;
  creating?: boolean;
  creatingQuote?: boolean;
  creatingJobAndQuote?: boolean;
}

interface ItemConflict {
  product_id: string;
  type: 'bulk' | 'specific';
  message: string;
}

export const ReviewConfirmationStep: React.FC<ReviewConfirmationStepProps> = ({ 
  onCreateJob, 
  onCreateQuote, 
  onCreateJobAndQuote, 
  onCreateInvoice,
  creating, 
  creatingQuote, 
  creatingJobAndQuote 
}) => {
  const { state, updateData } = useJobWizard();
  const d = state.data;
  const [checking, setChecking] = useState(false);
  const [itemConflicts, setItemConflicts] = useState<ItemConflict[]>([]);
  const [driverConflict, setDriverConflict] = useState<string | null>(null);
  const [vehicleConflict, setVehicleConflict] = useState<string | null>(null);
  
  // State for readable names
  const [customerName, setCustomerName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [vehicleDetails, setVehicleDetails] = useState<string>('');
  const [pickupDriverName, setPickupDriverName] = useState<string>('');
  const [pickupVehicleDetails, setPickupVehicleDetails] = useState<string>('');
  const [partialPickupAssignments, setPartialPickupAssignments] = useState<Record<string, { driver: string; vehicle: string }>>({});
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

      // Fetch contact name
      if (d.contact_id) {
        const { data: contact } = await supabase
          .from('customer_contacts')
          .select('first_name, last_name, title, contact_type')
          .eq('id', d.contact_id)
          .maybeSingle();
        
        if (contact) {
          setContactName(`${contact.first_name} ${contact.last_name}${contact.title ? ` (${contact.title})` : ''}`);
        }
      } else {
        setContactName('');
      }

      // Fetch driver name
      if (d.driver_id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', d.driver_id)
            .single();
          
          if (data && !error) {
            setDriverName(`${data.first_name} ${data.last_name}`);
          }
        } catch (error) {
          console.error('Error fetching driver:', error);
        }
      }

      // Fetch pickup driver name
      if (d.pickup_driver_id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', d.pickup_driver_id)
            .single();
          
          if (data && !error) {
            setPickupDriverName(`${data.first_name} ${data.last_name}`);
          }
        } catch (error) {
          console.error('Error fetching pickup driver:', error);
        }
      }

      // Fetch vehicle details
      if (d.vehicle_id) {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .select('license_plate, year, make, model')
            .eq('id', d.vehicle_id)
            .single();
          
          if (data && !error) {
            setVehicleDetails(`${data.year} ${data.make} ${data.model} (${data.license_plate})`);
          }
        } catch (error) {
          console.error('Error fetching vehicle:', error);
        }
      }

      // Fetch pickup vehicle details  
      if (d.pickup_vehicle_id) {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .select('license_plate, year, make, model')
            .eq('id', d.pickup_vehicle_id)
            .single();
          
          if (data && !error) {
            setPickupVehicleDetails(`${data.year} ${data.make} ${data.model} (${data.license_plate})`);
          }
        } catch (error) {
          console.error('Error fetching pickup vehicle:', error);
        }
      }

      // Fetch partial pickup assignments
      if (d.partial_pickup_assignments && d.partial_pickups) {
        const assignments: Record<string, { driver: string; vehicle: string }> = {};
        
        for (const pickup of d.partial_pickups) {
          const assignment = d.partial_pickup_assignments[pickup.id];
          if (assignment) {
            let driverName = 'No driver assigned';
            let vehicleName = 'No vehicle assigned';

            // Fetch driver name
            if (assignment.driver_id) {
              try {
                const { data, error } = await supabase
                  .from('profiles')
                  .select('first_name, last_name')
                  .eq('id', assignment.driver_id)
                  .single();
                
                if (data && !error) {
                  driverName = `${data.first_name} ${data.last_name}`;
                }
              } catch (error) {
                console.error('Error fetching partial pickup driver:', error);
              }
            }

            // Fetch vehicle details
            if (assignment.vehicle_id) {
              try {
                const { data, error } = await supabase
                  .from('vehicles')
                  .select('license_plate, year, make, model')
                  .eq('id', assignment.vehicle_id)
                  .single();
                
                if (data && !error) {
                  vehicleName = `${data.year} ${data.make} ${data.model} (${data.license_plate})`;
                }
              } catch (error) {
                console.error('Error fetching partial pickup vehicle:', error);
              }
            }

            assignments[pickup.id] = { driver: driverName, vehicle: vehicleName };
          }
        }
        
        setPartialPickupAssignments(assignments);
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
  }, [d.customer_id, d.contact_id, d.driver_id, d.vehicle_id, d.pickup_driver_id, d.pickup_vehicle_id, d.partial_pickup_assignments, d.partial_pickups, items]);
  
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

  const formatTimezone = (timezone: string) => {
    // Remove underscores and add timezone abbreviations
    const cleanTimezone = timezone.replace(/_/g, ' ');
    const timezoneMap: Record<string, string> = {
      'America/New York': 'America/New York - Eastern',
      'America/Chicago': 'America/Chicago - Central', 
      'America/Denver': 'America/Denver - Mountain',
      'America/Los Angeles': 'America/Los Angeles - Pacific',
      'America/Phoenix': 'America/Phoenix - Mountain',
      'America/Anchorage': 'America/Anchorage - Alaska',
      'Pacific/Honolulu': 'Pacific/Honolulu - Hawaii'
    };
    return timezoneMap[cleanTimezone] || cleanTimezone;
  };

  const isQuoteMode = state.wizardMode === 'quote';
  const isJobAndQuoteMode = state.wizardMode === 'job_and_quote';

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h2 className="text-lg font-semibold">Review & Create</h2>
        {isQuoteMode ? (
          <p className="text-sm text-muted-foreground">Review your quote details before creating the quote for customer approval.</p>
        ) : isJobAndQuoteMode ? (
          <p className="text-sm text-muted-foreground">Choose how to save this job: create a quote for approval, create both a quote and an active job, or create a job directly.</p>
        ) : (
          <p className="text-sm text-muted-foreground">We'll validate availability before creating the job.</p>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border p-3 space-y-1">
          <h3 className="font-medium">Basics</h3>
          <div>Customer: {customerName || d.customer_id || '—'}</div>
          {contactName && <div>Contact: {contactName}</div>}
          <div>Type: {d.job_type ? d.job_type.charAt(0).toUpperCase() + d.job_type.slice(1) : '—'}</div>
          <div>Date: {d.scheduled_date || '—'}{d.return_date ? ` → ${d.return_date}` : ''}</div>
          <div>Time: {d.scheduled_time || '—'} ({formatTimezone(d.timezone)})</div>
        </div>
        <div className="rounded-lg border p-3 space-y-1">
          <h3 className="font-medium">Main Job Assignments</h3>
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

        {/* Pickup Summary */}
        {(d.create_pickup_job || d.create_partial_pickups) && (
          <div className="rounded-lg border p-3 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Pickup Summary</h3>
            </div>
            
            {/* Partial Pickups */}
            {d.create_partial_pickups && d.partial_pickups && d.partial_pickups.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Partial Pickups</h4>
                {d.partial_pickups.map((pickup, index) => (
                  <div key={pickup.id} className="border rounded-lg p-3">
                    <div className="font-medium text-sm">
                      Partial Pickup #{index + 1}: {pickup.date ? new Date(pickup.date).toLocaleDateString() : 'Not set'}
                    </div>
                    {pickup.time && (
                      <div className="text-sm text-muted-foreground">Time: {pickup.time}</div>
                    )}
                    {pickup.notes && (
                      <div className="text-sm text-muted-foreground">Notes: {pickup.notes}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Driver: {partialPickupAssignments[pickup.id]?.driver || 'No driver assigned'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Vehicle: {partialPickupAssignments[pickup.id]?.vehicle || 'No vehicle assigned'}
                    </div>
                    
                    {/* Partial pickup inventory */}
                    {d.pickup_inventory_selections?.partial_pickups?.[pickup.id] && (
                      <div className="mt-2 text-xs">
                        <div className="font-medium">Inventory to pickup:</div>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                          {d.pickup_inventory_selections.partial_pickups[pickup.id].map((item, itemIndex) => {
                            const product = productDetails[item.product_id];
                            const productName = product?.name || item.product_id;
                            return (
                              <li key={itemIndex}>
                                {productName} × {item.quantity}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Main Pickup Job */}
            {d.create_pickup_job && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Final Pickup</h4>
                <div className="border rounded-lg p-3">
                  <div className="font-medium text-sm">
                    Date: {d.pickup_date ? new Date(d.pickup_date).toLocaleDateString() : 'Not set'}
                  </div>
                  {d.pickup_time && (
                    <div className="text-sm text-muted-foreground">Time: {d.pickup_time}</div>
                  )}
                  {d.pickup_notes && (
                    <div className="text-sm text-muted-foreground">Notes: {d.pickup_notes}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Driver: {pickupDriverName || 'No driver assigned'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Vehicle: {pickupVehicleDetails || 'No vehicle assigned'}
                  </div>
                  
                  {/* Main pickup inventory */}
                  {d.pickup_inventory_selections?.main_pickup && (
                    <div className="mt-2 text-xs">
                      <div className="font-medium">Inventory to pickup:</div>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        {d.pickup_inventory_selections.main_pickup.map((item, itemIndex) => {
                          const product = productDetails[item.product_id];
                          const productName = product?.name || item.product_id;
                          return (
                            <li key={itemIndex}>
                              {productName} × {item.quantity}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rounded-lg border p-3 space-y-1 md:col-span-2">
          <h3 className="font-medium">Total</h3>
          <div className="text-lg font-bold">{formatCurrency(jobTotal)}</div>
        </div>
      </div>

      {/* Action Buttons - Different based on wizard mode */}
      {!isQuoteMode && !isJobAndQuoteMode ? (
        /* Regular job creation mode */
        <div className="flex justify-center">
          <Button
            onClick={onCreateJob}
            disabled={creating}
            className="min-w-[120px]"
          >
            {creating ? 'Creating...' : 'Create Job'}
          </Button>
        </div>
      ) : isQuoteMode ? (
        /* Quote only mode - aligned with navigation */
        <div className="flex justify-end">
          <Button
            onClick={onCreateQuote}
            disabled={creatingQuote}
            className="min-w-[120px]"
          >
            {creatingQuote ? 'Creating...' : 'Create Quote'}
          </Button>
        </div>
      ) : (
        /* Three-button mode */
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Choose how you'd like to save this job: create a quote for customer approval, create both a quote and an active job, or skip quoting and create a job directly.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-medium mb-1">Create Quote</h3>
                <p className="text-xs text-muted-foreground mb-3">Save as quote only for customer approval</p>
                <Button
                  onClick={onCreateQuote}
                  disabled={creatingQuote}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {creatingQuote ? 'Creating...' : 'Quote Only'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <FileText className="h-6 w-6 text-green-600" />
                  <BriefcaseIcon className="h-6 w-6 text-green-600 -ml-2" />
                </div>
                <h3 className="font-medium mb-1">Create Both</h3>
                <p className="text-xs text-muted-foreground mb-3">Generate quote and create active job</p>
                <Button
                  onClick={onCreateJobAndQuote}
                  disabled={creatingJobAndQuote}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {creatingJobAndQuote ? 'Creating...' : 'Quote + Job'}
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <BriefcaseIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-medium mb-1">Create Job</h3>
                <p className="text-xs text-muted-foreground mb-3">Skip quoting and create job immediately</p>
                <Button
                  onClick={onCreateJob}
                  disabled={creating}
                  variant="outline"
                  className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  {creating ? 'Creating...' : 'Job Only'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Create Invoice Section - shows after job creation would be useful */}
          {onCreateInvoice && (
            <div className="pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  After creating your job, you can immediately generate an invoice for this work.
                </p>
                <Button
                  onClick={onCreateInvoice}
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};