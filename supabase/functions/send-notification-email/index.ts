import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  userId: string;
  notificationType: string; // e.g., 'job_assignments', 'invoice_reminders', etc.
  subject: string;
  htmlContent: string;
  data?: any;
}

// Helper function to get company email sender details
async function getCompanyEmailSender(supabase: any) {
  const { data, error } = await supabase
    .from('company_settings')
    .select('support_email, company_email, company_name')
    .single();
  
  if (error || !data) {
    return {
      fromEmail: 'notifications@portaprosoftware.com',
      fromName: 'PortaPro Notifications'
    };
  }
  
  return {
    fromEmail: data.company_email || data.support_email || 'notifications@portaprosoftware.com',
    fromName: data.company_name || 'PortaPro'
  };
}

// Email template wrapper with branding
function wrapEmailTemplate(content: string, companyName: string = 'PortaPro'): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 30px 20px; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
          .button:hover { opacity: 0.9; }
          .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>You received this email because you have notifications enabled in your ${companyName} account.</p>
            <p>To manage your notification preferences, visit your <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/settings/notifications">Settings</a>.</p>
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
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

    const { userId, notificationType, subject, htmlContent, data }: EmailRequest = await req.json();

    console.log('Processing email notification:', { userId, notificationType });

    // 1. Check notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notification preferences' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email notifications are enabled for this type
    const emailField = `${notificationType}_email`;
    if (preferences && preferences[emailField] === false) {
      console.log(`Email notifications disabled for ${notificationType}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email notifications disabled for this type',
          sent: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get user's email address
    let userEmail = preferences?.email;
    
    if (!userEmail) {
      // Fallback: try to get from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      userEmail = profile?.email;
    }

    if (!userEmail) {
      console.error('No email address found for user:', userId);
      return new Response(
        JSON.stringify({ error: 'User email address not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get company email settings
    const { fromEmail, fromName } = await getCompanyEmailSender(supabase);

    // 4. Wrap content in branded template
    const finalHtml = wrapEmailTemplate(htmlContent, fromName);

    // 5. Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [userEmail],
        subject: subject,
        html: finalHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`);
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    // 6. Log notification to database
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        notification_type: notificationType,
        channel: 'email',
        status: 'sent',
        recipient: userEmail,
        content: { subject, data },
        sent_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: true,
        emailId: emailResult.id,
        recipient: userEmail 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-notification-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
