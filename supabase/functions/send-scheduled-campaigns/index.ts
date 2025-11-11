import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔍 Checking for scheduled campaigns to send...");

    // Query all scheduled campaigns that are due to be sent (across all organizations)
    const { data: scheduledCampaigns, error: fetchError } = await supabase
      .from("marketing_campaigns")
      .select("id, name, organization_id, scheduled_at")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    if (fetchError) {
      console.error("❌ Error fetching scheduled campaigns:", fetchError);
      throw new Error(`Error fetching scheduled campaigns: ${fetchError.message}`);
    }

    console.log(`📊 Found ${scheduledCampaigns?.length || 0} campaigns to send`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    if (scheduledCampaigns && scheduledCampaigns.length > 0) {
      for (const campaign of scheduledCampaigns) {
        try {
          console.log(`📧 Processing campaign ${campaign.id} - "${campaign.name}" for org ${campaign.organization_id}`);
          console.log(`   Scheduled for: ${campaign.scheduled_at}`);

          // Call the send-marketing-campaign function
          const sendResponse = await supabase.functions.invoke("send-marketing-campaign", {
            body: { campaignId: campaign.id },
          });

          if (sendResponse.error) {
            throw new Error(`Failed to send campaign: ${sendResponse.error.message}`);
          }

          console.log(`✅ Campaign ${campaign.id} sent successfully`);

          // Update campaign status to 'sent' and set sent_at timestamp
          const { error: updateError } = await supabase
            .from("marketing_campaigns")
            .update({ 
              status: "sent",
              sent_at: new Date().toISOString()
            })
            .eq("id", campaign.id)
            .eq("organization_id", campaign.organization_id); // Multi-tenant safety

          if (updateError) {
            console.error(`⚠️ Campaign sent but failed to update status:`, updateError);
            // Don't throw - campaign was sent, just status update failed
          } else {
            console.log(`✅ Campaign ${campaign.id} status updated to 'sent'`);
          }

          successCount++;
          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            organizationId: campaign.organization_id,
            status: "success",
            sentAt: new Date().toISOString(),
            data: sendResponse.data,
          });
        } catch (error: any) {
          console.error(`❌ Error processing campaign ${campaign.id}:`, error);
          failureCount++;

          // Update campaign status to failed
          await supabase
            .from("marketing_campaigns")
            .update({ 
              status: "failed",
              sent_at: new Date().toISOString() // Record when the failure occurred
            })
            .eq("id", campaign.id)
            .eq("organization_id", campaign.organization_id); // Multi-tenant safety

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            organizationId: campaign.organization_id,
            status: "error",
            error: error.message,
          });
        }
      }
    }

    const summary = {
      success: true,
      totalFound: scheduledCampaigns?.length || 0,
      successCount,
      failureCount,
      results,
      timestamp: new Date().toISOString(),
    };

    console.log(`📊 Processing complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ Critical error in send-scheduled-campaigns function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
