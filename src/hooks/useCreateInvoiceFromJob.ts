import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { resolveTaxRate, normalizeZip } from '@/lib/tax';

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

      // Get the job details with customer information
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name,
            email,
            phone,
            billing_differs_from_service,
            billing_street,
            billing_street2,
            billing_city,
            billing_state,
            billing_zip,
            service_street,
            service_street2,
            service_city,
            service_state,
            service_zip,
            default_service_street,
            default_service_city,
            default_service_state,
            default_service_zip
          )
        `)
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

      // Resolve tax rate based on customer ZIP/state and company settings
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('tax_enabled, tax_method, flat_tax_rate, state_tax_rates, zip_tax_overrides')
        .single();

      const { data: customer } = await supabase
        .from('customers')
        .select('service_zip, default_service_zip, billing_zip, service_state, default_service_state, billing_state')
        .eq('id', job.customer_id)
        .maybeSingle();

      const zip = customer?.service_zip || customer?.default_service_zip || customer?.billing_zip || '';
      const state = customer?.service_state || customer?.default_service_state || customer?.billing_state || '';
      const zip5 = normalizeZip(zip);

      let tableZipRate: number | null = null;
      if (zip5) {
        const { data: tr } = await supabase
          .from('tax_rates')
          .select('tax_rate')
          .eq('zip_code', zip5)
          .maybeSingle();
        tableZipRate = tr ? Number(tr.tax_rate) : null;
      }

      let externalZipRate: number | null = null;
      if (zip5 && tableZipRate == null) {
        try {
          const { data: tjData, error: tjError } = await supabase.functions.invoke('taxjar-rate', {
            body: { zip: zip5, state },
          });
          if (!tjError && tjData?.rateDecimal != null) {
            externalZipRate = Number(tjData.rateDecimal);
          }
        } catch (e) {
          console.warn('[useCreateInvoiceFromJob] TaxJar lookup failed', e);
        }
      }

      const effectiveZipRate = tableZipRate ?? externalZipRate;

      const taxRate = resolveTaxRate(companySettings as any, { zip: zip5, state, tableZipRate: effectiveZipRate });

      const taxAmount = subtotal * taxRate;
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
          terms: terms || 'Net 7',
          // Auto-fill customer contact information
          customer_name: job.customers?.name || '',
          customer_email: job.customers?.email || '',
          customer_phone: job.customers?.phone || '',
          billing_address: job.customers?.billing_differs_from_service 
            ? [job.customers?.billing_street, job.customers?.billing_street2, job.customers?.billing_city, job.customers?.billing_state, job.customers?.billing_zip].filter(Boolean).join(', ')
            : [job.customers?.service_street || job.customers?.default_service_street, job.customers?.service_street2, job.customers?.service_city || job.customers?.default_service_city, job.customers?.service_state || job.customers?.default_service_state, job.customers?.service_zip || job.customers?.default_service_zip].filter(Boolean).join(', '),
          service_address: [job.customers?.service_street || job.customers?.default_service_street, job.customers?.service_street2, job.customers?.service_city || job.customers?.default_service_city, job.customers?.service_state || job.customers?.default_service_state, job.customers?.service_zip || job.customers?.default_service_zip].filter(Boolean).join(', ')
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