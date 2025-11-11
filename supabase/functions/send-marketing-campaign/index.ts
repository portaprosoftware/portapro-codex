import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

interface SendCampaignRequest {
  campaignId: string;
}

// Helper function to rewrite links in HTML for click tracking
function rewriteLinksForTracking(html: string, campaignId: string, customerId: string, appUrl: string): string {
  const trackingBaseUrl = `${appUrl}/functions/v1/track-click/${campaignId}/${customerId}`;
  
  // Replace all <a href="..."> with tracking URLs
  return html.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
    (match, before, href, after) => {
      // Skip if already a tracking URL or if it's a mailto: or tel: link
      if (href.includes('/track-click/') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return match;
      }
      
      const trackedUrl = `${trackingBaseUrl}?url=${encodeURIComponent(href)}`;
      return `<a ${before}href="${trackedUrl}"${after}>`;
    }
  );
}

// Helper function to inject tracking pixel
function injectTrackingPixel(html: string, campaignId: string, customerId: string, appUrl: string): string {
  const pixelUrl = `${appUrl}/functions/v1/track-open/${campaignId}/${customerId}.png`;
  const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;border:0;" />`;
  
  // Try to inject before closing </body> tag, otherwise append to end
  if (html.toLowerCase().includes('</body>')) {
    return html.replace(/<\/body>/i, `${trackingPixel}</body>`);
  } else {
    return html + trackingPixel;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const appUrl = Deno.env.get("VITE_APP_URL") || "https://app.portaprosoftware.com";

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { campaignId }: SendCampaignRequest = await req.json();

    console.log("Processing campaign:", campaignId);

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`);
    }

    // Update campaign status to 'sending'
    await supabase
      .from("marketing_campaigns")
      .update({ status: "sending" })
      .eq("id", campaignId);

    let recipients: any[] = [];

    // Get recipients based on campaign configuration
    if (campaign.recipient_type === "all") {
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, email")
        .not("email", "is", null);
      recipients = customers || [];
    } else if (campaign.recipient_type === "segments" && campaign.target_segments?.length > 0) {
      // For now, implement basic segment logic - this can be enhanced later
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, email")
        .not("email", "is", null);
      recipients = customers || [];
    } else if (campaign.recipient_type === "individuals" && campaign.target_customers?.length > 0) {
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name, email")
        .in("id", campaign.target_customers)
        .not("email", "is", null);
      recipients = customers || [];
    }

    console.log(`Sending to ${recipients.length} recipients`);

    let successCount = 0;
    let failureCount = 0;
    let deliveredCount = 0;

    // Send emails to recipients
    for (const recipient of recipients) {
      try {
        let emailContent = "";
        let emailSubject = "";

        // Handle template vs custom message
        if (campaign.message_source === "template" && campaign.template_id) {
          const { data: template } = await supabase
            .from("communication_templates")
            .select("*")
            .eq("id", campaign.template_id)
            .single();

          if (template) {
            emailContent = template.content || template.email_content || "";
            emailSubject = template.subject || `Message from ${campaign.name}`;
          }
        } else if (campaign.custom_message) {
          emailContent = campaign.custom_message.content || "";
          emailSubject = campaign.custom_message.subject || `Message from ${campaign.name}`;
        }

        if (!emailContent) {
          console.warn(`No content for recipient ${recipient.email}`);
          continue;
        }

        // Rewrite links for click tracking and inject open tracking pixel
        let trackedEmailContent = rewriteLinksForTracking(emailContent, campaignId, recipient.id, appUrl);
        trackedEmailContent = injectTrackingPixel(trackedEmailContent, campaignId, recipient.id, appUrl);

        // Get company settings for from address
        const { from } = await getCompanyEmailSender(supabase);

        const emailResponse = await resend.emails.send({
          from: from,
          to: [recipient.email],
          subject: emailSubject,
          html: trackedEmailContent,
        });

        console.log(`Email sent to ${recipient.email}:`, emailResponse);

        // Log the communication
        await supabase.from("customer_communications").insert({
          customer_id: recipient.id,
          campaign_id: campaignId,
          type: "email",
          subject: emailSubject,
          content: emailContent,
          email_address: recipient.email,
          status: "sent",
          resend_email_id: emailResponse.data?.id,
        });

        // Insert delivered event into marketing_campaign_events
        await supabase.from("marketing_campaign_events").insert({
          campaign_id: campaignId,
          organization_id: campaign.organization_id,
          customer_id: recipient.id,
          event_type: "delivered",
          event_data: {
            resend_email_id: emailResponse.data?.id,
            email_address: recipient.email,
          },
        });

        successCount++;
        deliveredCount++;
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failureCount++;

        // Log failed communication
        await supabase.from("customer_communications").insert({
          customer_id: recipient.id,
          campaign_id: campaignId,
          type: "email",
          subject: emailSubject || "Failed to send",
          content: emailContent || "",
          email_address: recipient.email,
          status: "failed",
        });

        // Insert failed event into marketing_campaign_events
        await supabase.from("marketing_campaign_events").insert({
          campaign_id: campaignId,
          organization_id: campaign.organization_id,
          customer_id: recipient.id,
          event_type: "failed",
          event_data: {
            error: error.message,
            email_address: recipient.email,
          },
        });
      }
    }

    // Update campaign status and metrics
    const finalStatus = failureCount === 0 ? "completed" : "completed_with_errors";
    
    await supabase
      .from("marketing_campaigns")
      .update({
        status: finalStatus,
        total_recipients: recipients.length,
        delivered_count: deliveredCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    console.log(`Campaign ${campaignId} completed: ${successCount} sent, ${deliveredCount} delivered, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        totalRecipients: recipients.length,
        successCount,
        deliveredCount,
        failureCount,
        status: finalStatus,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-marketing-campaign function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);