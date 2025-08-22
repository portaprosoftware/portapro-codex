import React, { useState } from 'react';
import { InvoiceStatusDisplay } from '@/components/invoices/InvoiceStatusDisplay';
import { EnhancedInvoiceWizard } from '@/components/invoices/EnhancedInvoiceWizard';

interface JobInvoicesTabProps {
  jobId: string;
}

export function JobInvoicesTab({ jobId }: JobInvoicesTabProps) {
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);

  return (
    <div className="space-y-6">
      <InvoiceStatusDisplay
        jobId={jobId}
        showCreateButton={true}
        onCreateInvoice={() => setShowInvoiceWizard(true)}
      />

      <EnhancedInvoiceWizard
        isOpen={showInvoiceWizard}
        onClose={() => setShowInvoiceWizard(false)}
        fromJobId={jobId}
      />
    </div>
  );
}