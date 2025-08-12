import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJobWizard } from '@/contexts/JobWizardContext';

export const WizardPreviewSummary: React.FC = () => {
  const { state } = useJobWizard();
  const items = state.data.items || [];
  const totalUnits = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const services = state.data.servicesData || { selectedServices: [], servicesSubtotal: 0 };

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
                  <span className="truncate max-w-[60%]">{i.product_id}</span>
                  <span className="text-muted-foreground">× {i.quantity}</span>
                </li>
              ))}
              {items.length > 4 && (
                <li className="text-xs text-muted-foreground">+ {items.length - 4} more…</li>
              )}
            </ul>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Live preview — selections update instantly from the embedded wizard.
        </p>
      </CardContent>
    </Card>
  );
};
