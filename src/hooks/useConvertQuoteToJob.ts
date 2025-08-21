import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConvertQuoteToJobParams {
  quoteId: string;
}

export function useConvertQuoteToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quoteId }: ConvertQuoteToJobParams) => {
      console.log('Converting quote to job:', quoteId);

      // First, get the quote details
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Get quote items separately
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId);

      if (itemsError) throw itemsError;

      if (quote.status !== 'accepted') {
        throw new Error('Only accepted quotes can be converted to jobs');
      }

      // Check if a job already exists for this quote
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (existingJob) {
        throw new Error('A job already exists for this quote');
      }

      // Get quote items and separate inventory from services
      const inventoryItems = quoteItems?.filter((item: any) => item.product_id) || [];
      const serviceItems = quoteItems?.filter((item: any) => item.service_id) || [];

      // Determine job type based on quote items
      const hasInventory = inventoryItems.length > 0;
      const hasServices = serviceItems.length > 0;
      
      let jobType = 'delivery'; // Default
      if (hasServices && !hasInventory) {
        jobType = 'service';
      }

      // Calculate rental duration from quote items (use first inventory item's rental duration)
      const rentalDuration = inventoryItems.length > 0 ? inventoryItems[0].rental_duration_days || 1 : 1;
      
      // Create the job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          customer_id: quote.customer_id,
          quote_id: quoteId,
          job_type: jobType,
          scheduled_date: new Date().toISOString().split('T')[0], // Today's date as default
          scheduled_time: '09:00', // Default time
          timezone: 'America/New_York',
          notes: `Job created from quote ${quote.quote_number}`,
          status: 'assigned',
          total_price: quote.total_amount,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Create job items for inventory
      if (inventoryItems.length > 0) {
        const jobInventoryItems = inventoryItems.map((item: any) => ({
          job_id: job.id,
          product_id: item.product_id,
          product_variation_id: item.product_variation_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.line_total,
          line_item_type: 'inventory',
        }));

        const { error: inventoryError } = await supabase
          .from('job_items')
          .insert(jobInventoryItems);

        if (inventoryError) throw inventoryError;
      }

      // Create job items for services
      if (serviceItems.length > 0) {
        const jobServiceItems = serviceItems.map((item: any) => ({
          job_id: job.id,
          service_id: item.service_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.line_total,
          line_item_type: 'service',
          service_frequency: item.service_frequency,
        }));

        const { error: serviceError } = await supabase
          .from('job_items')
          .insert(jobServiceItems);

        if (serviceError) throw serviceError;
      }

      return job;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success(`Job ${job.job_number} created successfully from quote!`);
    },
    onError: (error: Error) => {
      console.error('Error converting quote to job:', error);
      toast.error(error.message || 'Failed to convert quote to job');
    },
  });
}