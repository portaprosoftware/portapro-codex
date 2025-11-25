import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Invoice Reminders] Starting scheduled check...');

    // Get current date and 3 days from now
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Query invoices that are:
    // 1. Due in 3 days (upcoming reminder)
    // 2. Overdue (past due date)
    // 3. Status is 'pending'
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer_id, total_amount, due_date, customers(id, name, email)')
      .eq('status', 'pending')
      .or(`due_date.eq.${threeDaysFromNow.toISOString().split('T')[0]},due_date.lt.${today.toISOString().split('T')[0]}`)
      .limit(50);

    if (fetchError) {
      console.error('[Invoice Reminders] Error fetching invoices:', fetchError);
      throw fetchError;
    }

    console.log(`[Invoice Reminders] Found ${invoices?.length || 0} invoices to process`);

    let successCount = 0;
    let errorCount = 0;

    // Send reminders for each invoice
    for (const invoice of invoices || []) {
      try {
        const isOverdue = new Date(invoice.due_date) < today;
        
        await supabase.functions.invoke('trigger-invoice-reminder', {
          body: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            customerId: invoice.customer_id,
            customerName: (invoice.customers as any)?.name || 'Customer',
            amount: invoice.total_amount,
            dueDate: invoice.due_date,
            isOverdue,
            daysUntilDue: isOverdue 
              ? Math.floor((today.getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
              : 3,
            notifyUserIds: [], // Will be fetched in trigger function based on roles
          }
        });

        successCount++;
        console.log(`[Invoice Reminders] Sent reminder for invoice ${invoice.invoice_number}`);
      } catch (error) {
        errorCount++;
        console.error(`[Invoice Reminders] Error sending reminder for invoice ${invoice.invoice_number}:`, error);
      }
    }

    console.log(`[Invoice Reminders] Completed: ${successCount} sent, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: invoices?.length || 0,
      sent: successCount,
      errors: errorCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Invoice Reminders] Fatal error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
