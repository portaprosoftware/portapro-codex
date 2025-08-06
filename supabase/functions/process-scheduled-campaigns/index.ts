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

    console.log("Processing scheduled campaigns...");

    // Get campaigns that are scheduled and due to be sent
    const { data: scheduledCampaigns, error: fetchError } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString());

    if (fetchError) {
      throw new Error(`Error fetching scheduled campaigns: ${fetchError.message}`);
    }

    console.log(`Found ${scheduledCampaigns?.length || 0} campaigns to process`);

    const results = [];

    if (scheduledCampaigns && scheduledCampaigns.length > 0) {
      for (const campaign of scheduledCampaigns) {
        try {
          console.log(`Processing campaign: ${campaign.id} - ${campaign.name}`);

          // Call the send-marketing-campaign function
          const sendResponse = await supabase.functions.invoke("send-marketing-campaign", {
            body: { campaignId: campaign.id },
          });

          if (sendResponse.error) {
            throw new Error(`Failed to send campaign: ${sendResponse.error.message}`);
          }

          console.log(`Campaign ${campaign.id} processed successfully`);
          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: "success",
            data: sendResponse.data,
          });
        } catch (error: any) {
          console.error(`Error processing campaign ${campaign.id}:`, error);

          // Update campaign status to failed
          await supabase
            .from("marketing_campaigns")
            .update({ status: "failed" })
            .eq("id", campaign.id);

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: "error",
            error: error.message,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: scheduledCampaigns?.length || 0,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in process-scheduled-campaigns function:", error);

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