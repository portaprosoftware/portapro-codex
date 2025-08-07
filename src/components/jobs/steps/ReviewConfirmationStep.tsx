import React from 'react';
import { useJobWizard } from '@/contexts/JobWizardContext';
import { Button } from '@/components/ui/button';

interface ReviewConfirmationStepProps {
  onCreateJob: () => void;
  creating?: boolean;
}

export const ReviewConfirmationStep: React.FC<ReviewConfirmationStepProps> = ({ onCreateJob, creating }) => {
  const { state } = useJobWizard();
  const d = state.data;

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted-foreground">Confirm all details before creating the job.</p>
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
          <div>Vehicle: <span className="font-mono text-xs">{d.vehicle_id || '—'}</span></div>
        </div>
        <div className="rounded-lg border p-3 space-y-2 md:col-span-2">
          <h3 className="font-medium">Items</h3>
          {d.items && d.items.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {d.items.map((it, i) => (
                <li key={i}>
                  <span className="font-mono text-xs">{it.product_id}</span> · qty {it.quantity} · {it.strategy}
                  {it.specific_item_ids && it.specific_item_ids.length > 0 && (
                    <> · items: {it.specific_item_ids.join(', ')}</>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No items selected</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onCreateJob} disabled={!!creating} className="min-w-[140px]">
          {creating ? 'Creating…' : 'Create Job'}
        </Button>
      </div>
    </div>
  );
};
