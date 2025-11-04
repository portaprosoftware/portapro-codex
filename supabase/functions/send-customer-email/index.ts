import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  customerId: string;
  subject: string;
  content: string;
  emailAddress?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerId, subject, content, emailAddress }: EmailRequest = await req.json();

    console.log('Email request received for customer:', customerId);

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    if (!subject || !content || !customerId) {
      throw new Error('Missing required fields: subject, content, or customerId');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get customer email if not provided
    let toEmail = emailAddress;
    if (!toEmail) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('email')
        .eq('id', customerId)
        .single();

      if (customerError || !customer?.email) {
        throw new Error('Customer email not found');
      }
      toEmail = customer.email;
    }

    // Get company settings for "from" email
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('support_email, company_email, company_name')
      .single();

    const fromEmail = companySettings?.support_email || companySettings?.company_email || 'onboarding@resend.dev';
    const fromName = companySettings?.company_name || 'PortaPro';

    console.log(`Sending email from ${fromName} <${fromEmail}> to ${toEmail}`);

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [toEmail],
        subject: subject,
        html: content.replace(/\n/g, '<br>'),
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`);
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully via Resend:', emailData.id);

    // Insert communication record into database
    const { data: commRecord, error: commError } = await supabase
      .from('customer_communications')
      .insert({
        customer_id: customerId,
        type: 'email',
        subject: subject,
        content: content,
        status: 'sent',
        sent_at: new Date().toISOString(),
        resend_email_id: emailData.id,
      })
      .select()
      .single();

    if (commError) {
      console.error('Error saving communication record:', commError);
      // Don't throw - email was sent successfully
    } else {
      console.log('Communication record saved:', commRecord.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: emailData.id,
        communicationId: commRecord?.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-customer-email function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
