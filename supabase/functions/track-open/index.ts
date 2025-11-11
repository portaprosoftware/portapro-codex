import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent PNG in base64
const TRANSPARENT_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse URL to extract campaignId and customerId
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1]; // e.g., "customer-id.png"
    const campaignId = pathParts[pathParts.length - 2];
    const customerId = filename.replace('.png', '');

    if (!campaignId || !customerId) {
      console.error("Invalid tracking pixel URL");
      return new Response(atob(TRANSPARENT_PNG), {
        headers: { "Content-Type": "image/png" },
        status: 200,
      });
    }

    console.log(`Open tracked: campaign=${campaignId}, customer=${customerId}`);

    // Fetch campaign to get organization_id
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("organization_id")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError);
      // Still return pixel even if tracking fails
      return new Response(atob(TRANSPARENT_PNG), {
        headers: { "Content-Type": "image/png" },
        status: 200,
      });
    }

    // Check if this customer has already opened (only track first open)
    const { data: existingOpen } = await supabase
      .from("marketing_campaign_events")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("customer_id", customerId)
      .eq("event_type", "opened")
      .limit(1);

    if (!existingOpen || existingOpen.length === 0) {
      // Insert open event (first time only)
      const { error: eventError } = await supabase
        .from("marketing_campaign_events")
        .insert({
          campaign_id: campaignId,
          organization_id: campaign.organization_id,
          customer_id: customerId,
          event_type: "opened",
          event_data: {
            user_agent: req.headers.get("user-agent"),
            timestamp: new Date().toISOString(),
          },
        });

      if (eventError) {
        console.error("Failed to insert open event:", eventError);
      }

      // Increment opened_count (only on first open)
      const { error: updateError } = await supabase.rpc("increment_campaign_opened", {
        campaign_id_param: campaignId,
      });

      if (updateError) {
        console.error("Failed to increment opened_count:", updateError);
      }
    }

    // Return 1x1 transparent PNG
    return new Response(atob(TRANSPARENT_PNG), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-cache, no-store, must-revalidate" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in track-open function:", error);
    
    // Always return pixel even on error
    return new Response(atob(TRANSPARENT_PNG), {
      headers: { "Content-Type": "image/png" },
      status: 200,
    });
  }
};

serve(handler);
