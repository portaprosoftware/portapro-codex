import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceReminderRequest {
  invoiceId: string;
  userId: string; // Billing manager or customer
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue?: number;
  paymentLink?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      invoiceId,
      userId,
      invoiceNumber,
      customerName,
      amount,
      dueDate,
      daysOverdue,
      paymentLink
    }: InvoiceReminderRequest = await req.json();

    console.log('Processing invoice reminder notification:', { invoiceId, userId, invoiceNumber, daysOverdue });

    if (!invoiceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: invoiceId and userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isOverdue = daysOverdue && daysOverdue > 0;
    const emailSubject = isOverdue 
      ? `Overdue Invoice Reminder: ${invoiceNumber}`
      : `Invoice Payment Reminder: ${invoiceNumber}`;

    // Generate email content
    const emailContent = `
      <h2 style="color: ${isOverdue ? '#ef4444' : '#667eea'}">${isOverdue ? 'Overdue' : 'Upcoming'} Invoice Payment</h2>
      <p>${isOverdue ? `This invoice is ${daysOverdue} days overdue.` : 'This invoice is due soon.'}</p>
      
      <div class="info-box" style="border-left-color: ${isOverdue ? '#ef4444' : '#667eea'}">
        <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        ${isOverdue ? `<p style="color: #ef4444;"><strong>Days Overdue:</strong> ${daysOverdue}</p>` : ''}
      </div>
      
      <p style="text-align: center;">
        ${paymentLink ? 
          `<a href="${paymentLink}" class="button" style="background: ${isOverdue ? '#ef4444' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">Pay Now</a>` : 
          `<a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/invoices/${invoiceId}" class="button">View Invoice</a>`
        }
      </p>
      
      ${isOverdue ? `
        <div style="background-color: #fee; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b;"><strong>Action Required:</strong> Please process this payment as soon as possible to avoid any service interruptions.</p>
        </div>
      ` : ''}
    `;

    // Send email notification
    const emailResult = await supabase.functions.invoke('send-notification-email', {
      body: {
        userId: userId,
        notificationType: 'invoice_reminders',
        subject: emailSubject,
        htmlContent: emailContent,
        data: {
          invoiceId,
          invoiceNumber,
          customerName,
          amount,
          dueDate,
          daysOverdue,
          isOverdue,
        }
      }
    });

    if (emailResult.error) {
      console.error('Error sending email notification:', emailResult.error);
    } else {
      console.log('Email notification sent successfully:', emailResult.data);
    }

    // Send push notification
    const pushResult = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: userId,
        title: isOverdue ? 'Overdue Invoice' : 'Invoice Payment Reminder',
        body: `${invoiceNumber} - $${amount.toFixed(2)} ${isOverdue ? `overdue by ${daysOverdue} days` : 'due soon'}`,
        notificationType: 'invoice_reminders',
        url: `/invoices/${invoiceId}`,
        data: {
          invoiceId,
          invoiceNumber,
          amount,
          daysOverdue,
          isOverdue,
        }
      }
    });

    if (pushResult.error) {
      console.error('Error sending push notification:', pushResult.error);
    } else {
      console.log('Push notification sent successfully:', pushResult.data);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invoice reminder notifications sent',
        email: emailResult.data,
        push: pushResult.data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in trigger-invoice-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
