import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FeedbackRequest {
  unit_id: string;
  feedback_type: 'assistance' | 'comment';
  customer_message: string;
  customer_email?: string;
  customer_phone?: string;
  photo_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const feedbackData: FeedbackRequest = await req.json();
    console.log('Processing QR feedback:', feedbackData);

    // Validate required fields
    if (!feedbackData.unit_id || !feedbackData.customer_message || !feedbackData.feedback_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unit information for context
    const { data: unit, error: unitError } = await supabase
      .from('product_items')
      .select(`
        *,
        products (
          name
        )
      `)
      .eq('id', feedbackData.unit_id)
      .single();

    if (unitError || !unit) {
      console.error('Unit not found:', unitError);
      return new Response(
        JSON.stringify({ error: 'Unit not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert feedback into database
    const { data: feedback, error: insertError } = await supabase
      .from('qr_feedback')
      .insert({
        unit_id: feedbackData.unit_id,
        feedback_type: feedbackData.feedback_type,
        customer_message: feedbackData.customer_message,
        customer_email: feedbackData.customer_email,
        customer_phone: feedbackData.customer_phone,
        photo_url: feedbackData.photo_url,
        is_read: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Feedback saved successfully:', feedback.id);

    // Get company settings for email configuration
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('qr_feedback_email, company_name')
      .limit(1)
      .single();

    const replyToEmail = companySettings?.qr_feedback_email || 'support@company.com';
    const companyName = companySettings?.company_name || 'PortaPro';

    // Send email notification using Resend
    if (Deno.env.get('RESEND_API_KEY')) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${companyName} <noreply@resend.dev>`,
            to: [replyToEmail],
            subject: `🚨 ${feedbackData.feedback_type === 'assistance' ? 'URGENT: Assistance Needed' : 'New Feedback'} - Unit ${unit.item_code}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: ${feedbackData.feedback_type === 'assistance' ? '#f97316' : '#3b82f6'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">
                    ${feedbackData.feedback_type === 'assistance' ? '🚨 Assistance Request' : '💬 Customer Feedback'}
                  </h1>
                </div>
                
                <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                  <h2 style="color: #374151; margin-top: 0;">Unit Information</h2>
                  <p><strong>Unit:</strong> ${unit.products?.name || 'Unknown'}</p>
                  <p><strong>Unit ID:</strong> ${unit.item_code}</p>
                  <p><strong>Status:</strong> ${unit.status}</p>
                  <p><strong>Location:</strong> ${unit.location || 'Not specified'}</p>
                  
                  <h2 style="color: #374151;">Customer Message</h2>
                  <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid ${feedbackData.feedback_type === 'assistance' ? '#f97316' : '#3b82f6'};">
                    <p style="margin: 0; white-space: pre-wrap;">${feedbackData.customer_message}</p>
                  </div>
                  
                  ${feedbackData.customer_email || feedbackData.customer_phone ? `
                  <h2 style="color: #374151;">Contact Information</h2>
                  ${feedbackData.customer_email ? `<p><strong>Email:</strong> <a href="mailto:${feedbackData.customer_email}">${feedbackData.customer_email}</a></p>` : ''}
                  ${feedbackData.customer_phone ? `<p><strong>Phone:</strong> <a href="tel:${feedbackData.customer_phone}">${feedbackData.customer_phone}</a></p>` : ''}
                  ` : ''}
                  
                  ${feedbackData.photo_url ? `
                  <h2 style="color: #374151;">Attached Photo</h2>
                  <p><a href="${feedbackData.photo_url}" target="_blank" style="color: #3b82f6;">View Photo</a></p>
                  ` : ''}
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Priority:</strong> ${feedbackData.feedback_type === 'assistance' ? 'HIGH' : 'Normal'}</p>
                    <p><strong>Feedback ID:</strong> ${feedback.id}</p>
                  </div>
                  
                  <div style="margin-top: 20px; text-align: center;">
                    <a href="https://unpnuonbndubcuzxfnmg.supabase.co" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      View in PortaPro Dashboard
                    </a>
                  </div>
                </div>
              </div>
            `,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error('Resend API error:', errorText);
        } else {
          console.log('Email notification sent successfully');
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    } else {
      console.log('No RESEND_API_KEY configured, skipping email notification');
    }

    // Publish real-time notification
    const channel = supabase.channel('qr-feedback-notifications');
    await channel.send({
      type: 'broadcast',
      event: 'new_feedback',
      payload: {
        id: feedback.id,
        unit_id: feedbackData.unit_id,
        unit_code: unit.item_code,
        product_name: unit.products?.name,
        feedback_type: feedbackData.feedback_type,
        customer_message: feedbackData.customer_message,
        customer_email: feedbackData.customer_email,
        customer_phone: feedbackData.customer_phone,
        photo_url: feedbackData.photo_url,
        created_at: feedback.created_at,
        is_read: false
      }
    });

    console.log('Real-time notification sent');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Feedback submitted successfully',
        feedback_id: feedback.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in qr-feedback-handler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);