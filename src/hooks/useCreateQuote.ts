import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { JobWizardData } from '@/contexts/JobWizardContext';
import { resolveTaxRate, normalizeZip } from '@/lib/tax';

interface CreateQuoteParams {
  wizardData: JobWizardData;
  status?: 'draft' | 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ wizardData, status = 'pending' }: CreateQuoteParams) => {
      console.log('Creating quote with data:', wizardData);

      // Get next quote number
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (!companySettings) {
        throw new Error('Company settings not found');
      }

      const nextNumber = companySettings.next_quote_number || 1;
      const prefix = companySettings.quote_number_prefix || 'Q';
      const quote_number = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

      // Calculate totals from items and services
      const items = wizardData.items || [];
      const services = wizardData.servicesData?.selectedServices || [];
      
      // Calculate rental days
      const startDate = wizardData.scheduled_date ? new Date(wizardData.scheduled_date) : new Date();
      const endDate = wizardData.return_date ? new Date(wizardData.return_date) : startDate;
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const rentalDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);

      // Get product prices for items
      let itemsSubtotal = 0;
      if (items.length > 0) {
        const productIds = [...new Set(items.map(item => item.product_id))];
        const { data: products } = await supabase
          .from('products')
          .select('id, default_price_per_day')
          .in('id', productIds);

        if (products) {
          const productPrices: Record<string, number> = {};
          products.forEach(product => {
            productPrices[product.id] = Number(product.default_price_per_day || 0);
          });

          itemsSubtotal = items.reduce((total, item) => {
            const pricePerDay = productPrices[item.product_id] || 0;
            return total + (pricePerDay * item.quantity * rentalDays);
          }, 0);
        }
      }

      const servicesSubtotal = Number(wizardData.servicesData?.servicesSubtotal || 0);
      const subtotal = itemsSubtotal + servicesSubtotal;
      
      // Resolve tax rate based on customer ZIP/state and company settings
      // Fetch customer location info
      const { data: customer } = await supabase
        .from('customers')
        .select('service_zip, default_service_zip, billing_zip, service_state, default_service_state, billing_state')
        .eq('id', wizardData.customer_id as string)
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

      const taxRate = resolveTaxRate(companySettings as any, { zip: zip5, state, tableZipRate });
      const tax_amount = subtotal * taxRate;
      const total_amount = subtotal + tax_amount;

      // Create the quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_id: wizardData.customer_id,
          quote_number,
          subtotal,
          discount_type: 'percentage',
          discount_value,
          additional_fees,
          tax_amount,
          total_amount,
          status,
          notes: wizardData.notes || '',
          terms: 'Payment due within 7 days of acceptance.',
          expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items for inventory
      if (items.length > 0) {
        const quoteItems = items.map(item => ({
          quote_id: quote.id,
          product_id: item.product_id,
          product_name: `Product ${item.product_id}`, // Will be updated by trigger
          quantity: item.quantity,
          unit_price: 0, // Will be updated by trigger
          line_total: 0, // Will be calculated by trigger
          rental_duration_days: rentalDays,
        }));

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems);

        if (itemsError) throw itemsError;
      }

      // Create quote items for services
      if (services.length > 0) {
        const serviceItems = services.map((service: any) => ({
          quote_id: quote.id,
          service_id: service.id,
          product_name: service.name || 'Service',
          quantity: 1,
          unit_price: Number(service.calculated_cost || 0),
          line_total: Number(service.calculated_cost || 0),
          service_frequency: service.frequency || 'one-time',
        }));

        const { error: serviceItemsError } = await supabase
          .from('quote_items')
          .insert(serviceItems);

        if (serviceItemsError) throw serviceItemsError;
      }

      // Update the next quote number
      await supabase
        .from('company_settings')
        .update({ next_quote_number: nextNumber + 1 })
        .eq('id', companySettings.id);

      return quote;
    },
    onSuccess: () => {
      // Invalidate and refetch quotes
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      // Also invalidate metrics that might show quote counts/totals
      queryClient.invalidateQueries({ queryKey: ['quote-metrics'] });
    },
  });
}