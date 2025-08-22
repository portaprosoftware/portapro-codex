import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TAXJAR_API_KEY")?.trim();
    if (!apiKey) {
      console.error("[taxjar-rate] Missing TAXJAR_API_KEY env");
      return new Response(JSON.stringify({ error: "Missing TAXJAR_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const zip: string | undefined = body?.zip?.toString();
    const state: string | undefined = body?.state?.toString();
    const city: string | undefined = body?.city?.toString();
    const street: string | undefined = body?.street?.toString();
    const country: string = (body?.country || "US").toString();

    if (!zip) {
      return new Response(JSON.stringify({ error: "zip is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(`https://api.taxjar.com/v2/rates/${encodeURIComponent(zip)}`);
    url.searchParams.set("country", country);
    if (state) url.searchParams.set("state", state);
    if (city) url.searchParams.set("city", city);
    if (street) url.searchParams.set("street", street);

    console.log("[taxjar-rate] Request:", url.toString());

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Token token=${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const text = await resp.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn("[taxjar-rate] Non-JSON response", text);
    }

    if (!resp.ok) {
      console.error("[taxjar-rate] TaxJar error", resp.status, text);
      return new Response(JSON.stringify({ error: "TaxJar API error", status: resp.status, body: text }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateObj = json?.rate;
    // TaxJar typically returns combined_rate as a decimal (e.g., "0.08875")
    const combined = rateObj?.combined_rate ?? rateObj?.state_rate ?? null;
    let rateDecimal = 0;
    if (combined != null) {
      const n = Number(combined);
      if (Number.isFinite(n)) {
        rateDecimal = n <= 1 ? n : n / 100; // handle percent-like strings defensively
      }
    }

    const result = { rateDecimal, source: "taxjar", raw: json };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[taxjar-rate] Unexpected error", error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
