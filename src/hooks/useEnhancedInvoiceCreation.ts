import { useState } from 'react';
import { useCreateInvoiceFromJob } from './useCreateInvoiceFromJob';
import { useConvertQuoteToJob } from './useConvertQuoteToJob';

interface InvoiceCreationData {
  fromType: 'job' | 'quote';
  sourceId: string;
  customerData?: any;
  itemsData?: any[];
  servicesData?: any[];
  notes?: string;
  dueDate?: Date;
}

export function useEnhancedInvoiceCreation() {
  const [isOpen, setIsOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<InvoiceCreationData | null>(null);
  
  const createFromJobMutation = useCreateInvoiceFromJob();
  const convertQuoteToJobMutation = useConvertQuoteToJob();

  const openForJob = (jobId: string, jobData?: any) => {
    setPrefillData({
      fromType: 'job',
      sourceId: jobId,
      customerData: jobData?.customer,
      itemsData: jobData?.items,
      servicesData: jobData?.services,
      notes: `Invoice for Job: ${jobData?.job_number || jobId}`
    });
    setIsOpen(true);
  };

  const openForQuote = (quoteId: string, quoteData?: any) => {
    setPrefillData({
      fromType: 'quote', 
      sourceId: quoteId,
      customerData: quoteData?.customer,
      itemsData: quoteData?.items,
      servicesData: quoteData?.services,
      notes: `Invoice for Quote: ${quoteData?.quote_number || quoteId}`
    });
    setIsOpen(true);
  };

  const createInvoice = async (invoiceData: any) => {
    if (!prefillData) return;

    if (prefillData.fromType === 'job') {
      return createFromJobMutation.mutateAsync({
        jobId: prefillData.sourceId,
        dueDate: invoiceData.dueDate,
        notes: invoiceData.notes,
        terms: invoiceData.terms
      });
    } else {
      // For quotes, we might want to convert to job first or create invoice directly
      // This depends on business logic requirements
      throw new Error('Quote to invoice conversion not yet implemented');
    }
  };

  const close = () => {
    setIsOpen(false);
    setPrefillData(null);
  };

  return {
    isOpen,
    prefillData,
    openForJob,
    openForQuote,
    createInvoice,
    close,
    isCreating: createFromJobMutation.isPending || convertQuoteToJobMutation.isPending
  };
}