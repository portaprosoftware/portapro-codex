import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin } from 'lucide-react';

export const WizardPreviewSummary: React.FC = () => {
  const { state } = useJobWizard();
  const items = state.data.items || [];
  const totalUnits = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const services = state.data.servicesData || { selectedServices: [], servicesSubtotal: 0 };
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [referencePins, setReferencePins] = useState<any[]>([]);

  // Fetch product names for display
  useEffect(() => {
    const fetchProductNames = async () => {
      if (items.length === 0) return;
      
      const productIds = [...new Set(items.map(item => item.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);
      
      if (products) {
        const nameMap: Record<string, string> = {};
        products.forEach(product => {
          nameMap[product.id] = product.name;
        });
        setProductNames(nameMap);
      }
    };

    fetchProductNames();
  }, [items]);

  // Fetch reference pin details with service locations
  useEffect(() => {
    const fetchReferencePins = async () => {
      if (!state.data.reference_pin_ids || state.data.reference_pin_ids.length === 0) {
        setReferencePins([]);
        return;
      }
      
      const { data: pins } = await supabase
        .from('customer_map_pins')
        .select(`
          *,
          service_location:customer_service_locations(
            id,
            location_name,
            street,
            city,
            state,
            zip
          )
        `)
        .in('id', state.data.reference_pin_ids);
      
      if (pins) {
        setReferencePins(pins);
      }
    };

    fetchReferencePins();
  }, [state.data.reference_pin_ids]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Wizard Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Job Type</div>
            <div className="text-sm font-semibold capitalize">{state.data.job_type || 'Not selected'}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Scheduled</div>
            <div className="text-sm font-semibold">
              {state.data.scheduled_date || '—'}{state.data.scheduled_time ? ` • ${state.data.scheduled_time}` : ''}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Units Selected</div>
            <div className="text-sm font-semibold">{totalUnits}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Services</div>
            <div className="text-sm font-semibold">{services.selectedServices.length} • ${services.servicesSubtotal.toFixed(2)}</div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-2">Items</div>
            <ul className="space-y-1">
              {items.slice(0, 4).map((i, idx) => (
                <li key={idx} className="text-sm flex items-center justify-between">
                  <span className="truncate max-w-[60%]">{productNames[i.product_id] || i.product_id}</span>
                  <span className="text-muted-foreground">× {i.quantity}</span>
                </li>
              ))}
              {items.length > 4 && (
                <li className="text-xs text-muted-foreground">+ {items.length - 4} more…</li>
              )}
            </ul>
          </div>
        )}

        {referencePins.length > 0 && (
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Reference Pins ({referencePins.length})
            </div>
            <div className="space-y-3">
              {/* Group pins by service location */}
              {(() => {
                // Group pins by service location
                const groupedPins: Record<string, any[]> = {};
                const pinsWithoutLocation: any[] = [];
                
                referencePins.forEach(pin => {
                  if (pin.service_location) {
                    const locationId = pin.service_location.id;
                    if (!groupedPins[locationId]) {
                      groupedPins[locationId] = [];
                    }
                    groupedPins[locationId].push(pin);
                  } else {
                    pinsWithoutLocation.push(pin);
                  }
                });

                return (
                  <>
                    {/* Render pins grouped by location */}
                    {Object.values(groupedPins).map((locationPins, groupIdx) => {
                      const location = locationPins[0].service_location;
                      const fullAddress = [location.street, location.city, location.state, location.zip]
                        .filter(Boolean)
                        .join(', ');
                      
                      return (
                        <div key={groupIdx} className="space-y-1">
                          <div className="text-sm font-medium text-foreground">
                            {location.location_name}
                          </div>
                          {fullAddress && (
                            <div className="text-xs text-muted-foreground mb-1">
                              {fullAddress}
                            </div>
                          )}
                          <ul className="space-y-1 ml-2">
                            {locationPins.map((pin, pinIdx) => (
                              <li key={pinIdx} className="text-sm text-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-destructive flex-shrink-0" />
                                {pin.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}

                    {/* Render pins without location */}
                    {pinsWithoutLocation.length > 0 && (
                      <ul className="space-y-1">
                        {pinsWithoutLocation.map((pin, idx) => (
                          <li key={idx} className="text-sm text-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-destructive flex-shrink-0" />
                            {pin.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Live preview — selections update instantly from the embedded wizard.
        </p>
      </CardContent>
    </Card>
  );
};
