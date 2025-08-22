import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateInvoiceFromJobParams {
  jobId: string;
  dueDate?: Date;
  notes?: string;
  terms?: string;
}

export function useCreateInvoiceFromJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, dueDate, notes, terms }: CreateInvoiceFromJobParams) => {
      console.log('Creating invoice from job:', jobId);

      // Get the job details
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Check if an invoice already exists
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle();

      if (existingInvoice) {
        throw new Error('An invoice already exists for this job');
      }

      // Get job items
      const { data: jobItems, error: itemsError } = await supabase
        .from('job_items')
        .select('*')
        .eq('job_id', jobId);

      if (itemsError) throw itemsError;

      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('get_next_invoice_number');

      if (numberError) throw numberError;

      // Calculate totals
      const subtotal = jobItems?.reduce((total: number, item: any) => {
        return total + (Number(item.total_price) || 0);
      }, 0) || 0;

      const taxAmount = subtotal * 0.08;
      const totalAmount = subtotal + taxAmount;

      const dueDateString = (dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        .toISOString().split('T')[0];

      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          customer_id: job.customer_id,
          job_id: jobId,
          invoice_number: invoiceNumber,
          amount: totalAmount,
          subtotal: subtotal,
          tax_amount: taxAmount,
          due_date: dueDateString,
          status: 'unpaid',
          notes: notes || `Invoice for Job: ${job.job_number || jobId}`,
          terms: terms || 'Net 7'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      if (jobItems && jobItems.length > 0) {
        const invoiceItems = jobItems.map((item: any) => ({
          invoice_id: invoice.id,
          product_id: item.product_id,
          product_variation_id: item.product_variation_id,
          product_name: item.line_item_type === 'inventory' ? 'Product' : undefined,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.total_price,
          description: item.line_item_type === 'inventory' ? 
            'Product rental' :
            `Service - ${item.service_frequency || 'one-time'}`
        }));

        const { error: invoiceItemsError } = await supabase
          .from('invoice_items')
          .insert(invoiceItems);

        if (invoiceItemsError) throw invoiceItemsError;
      }

      return invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success(`Invoice ${invoice.invoice_number} created successfully from job!`);
    },
    onError: (error: Error) => {
      console.error('Error creating invoice from job:', error);
      toast.error(error.message || 'Failed to create invoice from job');
    },
  });
}