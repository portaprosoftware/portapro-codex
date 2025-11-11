import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent PNG in base64
const transparentPixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

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
    const campaignId = pathParts[pathParts.length - 1].replace('.png', '');
    const customerId = pathParts[pathParts.length - 2];

    if (!campaignId || !customerId) {
      console.error("Invalid tracking URL - missing campaignId or customerId");
      // Still return pixel even if tracking fails
      return new Response(atob(transparentPixel), {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    console.log(`Open tracked: campaign=${campaignId}, customer=${customerId}`);

    // Fetch campaign to get organization_id
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("organization_id")
      .eq("id", campaignId)
      .maybeSingle();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError);
      // Still return pixel even if tracking fails
      return new Response(atob(transparentPixel), {
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Check if customer has already opened this campaign
    const { data: existingOpen } = await supabase
      .from("marketing_campaign_events")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("customer_id", customerId)
      .eq("event_type", "open")
      .maybeSingle();

    // Only insert if this is the first open
    if (!existingOpen) {
      const { error: eventError } = await supabase
        .from("marketing_campaign_events")
        .insert({
          campaign_id: campaignId,
          organization_id: campaign.organization_id,
          customer_id: customerId,
          event_type: "open",
          event_data: {
            user_agent: req.headers.get("user-agent"),
            timestamp: new Date().toISOString(),
          },
        });

      if (eventError) {
        console.error("Failed to insert open event:", eventError);
      }

      // Increment opened_count
      const { error: updateError } = await supabase.rpc("increment_campaign_opened", {
        campaign_id_param: campaignId,
      });

      if (updateError) {
        console.error("Failed to increment opened_count:", updateError);
      }
    }

    // Return transparent pixel
    return new Response(atob(transparentPixel), {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error in track-open function:", error);
    
    // Always return pixel even if there's an error
    return new Response(atob(transparentPixel), {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
};

serve(handler);
