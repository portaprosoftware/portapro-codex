import React, { useState } from 'react';
import { InvoiceStatusDisplay } from '@/components/invoices/InvoiceStatusDisplay';
import { EnhancedInvoiceWizard } from '@/components/invoices/EnhancedInvoiceWizard';

interface QuoteInvoicesTabProps {
  quoteId: string;
}

export function QuoteInvoicesTab({ quoteId }: QuoteInvoicesTabProps) {
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);

  return (
    <div className="space-y-6">
      <InvoiceStatusDisplay
        quoteId={quoteId}
        showCreateButton={true}
        onCreateInvoice={() => setShowInvoiceWizard(true)}
      />

      <EnhancedInvoiceWizard
        isOpen={showInvoiceWizard}
        onClose={() => setShowInvoiceWizard(false)}
        fromQuoteId={quoteId}
      />
    </div>
  );
}