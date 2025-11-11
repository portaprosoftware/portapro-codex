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

    // Parse URL to extract campaignId and customerId
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const campaignId = pathParts[pathParts.length - 2];
    const customerId = pathParts[pathParts.length - 1];
    const redirectUrl = url.searchParams.get('url');

    if (!campaignId || !customerId || !redirectUrl) {
      return new Response("Invalid tracking URL", { status: 400 });
    }

    console.log(`Click tracked: campaign=${campaignId}, customer=${customerId}`);

    // Fetch campaign to get organization_id
    const { data: campaign, error: campaignError } = await supabase
      .from("marketing_campaigns")
      .select("organization_id")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignError);
      // Still redirect even if tracking fails
      return Response.redirect(decodeURIComponent(redirectUrl), 302);
    }

    // Insert click event
    const { error: eventError } = await supabase
      .from("marketing_campaign_events")
      .insert({
        campaign_id: campaignId,
        organization_id: campaign.organization_id,
        customer_id: customerId,
        event_type: "clicked",
        event_data: {
          url: decodeURIComponent(redirectUrl),
          user_agent: req.headers.get("user-agent"),
          timestamp: new Date().toISOString(),
        },
      });

    if (eventError) {
      console.error("Failed to insert click event:", eventError);
    }

    // Increment clicked_count
    const { error: updateError } = await supabase.rpc("increment_campaign_clicked", {
      campaign_id_param: campaignId,
    });

    if (updateError) {
      console.error("Failed to increment clicked_count:", updateError);
    }

    // Redirect to original URL
    return Response.redirect(decodeURIComponent(redirectUrl), 302);
  } catch (error: any) {
    console.error("Error in track-click function:", error);
    
    // Try to redirect anyway if possible
    const url = new URL(req.url);
    const redirectUrl = url.searchParams.get('url');
    if (redirectUrl) {
      return Response.redirect(decodeURIComponent(redirectUrl), 302);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
