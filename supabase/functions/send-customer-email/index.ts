import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { verifyOrganization } from '../_shared/auth.ts';
import { createRemoteJWKSet, jwtVerify } from 'https://deno.land/x/jose@v4.15.4/index.ts';

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get company email sender information
async function getCompanyEmailSender(supabase: any): Promise<{ from: string }> {
  const { data: settings } = await supabase
    .from('company_settings')
    .select('support_email, company_email, company_name')
    .single();

  const email = settings?.support_email || settings?.company_email || 'onboarding@resend.dev';
  const name = settings?.company_name || 'PortaPro';
  
  return {
    from: `${name} <${email}>`
  };
}

interface EmailRequest {
  customerId: string;
  subject: string;
  content: string;
  emailAddress?: string;
  organizationId: string;
}

async function verifyClerkToken(authHeader: string | null): Promise<{ ok: boolean; sub?: string; error?: string }> {
  try {
    if (!authHeader) return { ok: false, error: 'Missing Authorization header' };
    const token = authHeader.replace('Bearer ', '').trim();
    const jwksUrl = Deno.env.get('CLERK_JWKS_URL');
    if (!jwksUrl) return { ok: false, error: 'Missing CLERK_JWKS_URL secret' };

    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    const issuer = Deno.env.get('CLERK_ISSUER');

    const { payload } = await jwtVerify(token, JWKS, issuer ? { issuer } : {});
    return { ok: true, sub: String(payload.sub) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid token' };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Clerk authentication
    const auth = await verifyClerkToken(req.headers.get('Authorization'));
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { customerId, subject, content, emailAddress, organizationId }: EmailRequest = await req.json();

    // Critical security check: Validate organizationId
    if (!organizationId) {
      return new Response(JSON.stringify({ error: 'organizationId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Verify user belongs to the claimed organization
    await verifyOrganization(auth.sub!, organizationId);

    console.log('Email request received for customer:', customerId);

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    if (!subject || !content || !customerId) {
      throw new Error('Missing required fields: subject, content, or customerId');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get customer email if not provided - verify organization ownership
    let toEmail = emailAddress;
    if (!toEmail) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('email')
        .eq('id', customerId)
        .eq('organization_id', organizationId) // Ensure customer belongs to this org
        .single();

      if (customerError || !customer?.email) {
        throw new Error('Customer email not found');
      }
      toEmail = customer.email;
    }

    // Get company settings for "from" email
    const { from } = await getCompanyEmailSender(supabase);

    console.log(`Sending email from ${from} to ${toEmail}`);

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from,
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

    // Insert communication record into database with organization_id
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
        organization_id: organizationId,
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
