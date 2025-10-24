import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Use Lovable AI gateway (preconfigured secret) instead of direct OpenAI API
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple timeout wrapper so UI doesn't spin forever if provider hangs
async function withTimeout<T>(p: Promise<T>, ms = 35000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), ms);
  try {
    // @ts-ignore fetch payloads below will pass signal
    const res = await p;
    clearTimeout(timer);
    return res as T;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailType, tone, customPrompt } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating customer email with params:", {
      emailType,
      tone,
      customPromptLength: customPrompt?.length,
    });

    const systemPrompt = `You are an expert email assistant for a portable toilet rental company.
- First, silently correct any spelling or grammar errors in the user's input.
- Then, produce a professional, ready-to-send email that preserves the intent.
- Keep it concise and clear for non-technical customers.
Return ONLY strict JSON with fields: {"subject": string, "content": string}.`;

    const userPrompt = `Create a ${tone || "professional"} ${emailType || "service_update"} email.
User input (may contain typos): "${customPrompt || ""}"`;

    console.log("Calling Lovable AI gateway with google/gemini-2.5-flash...");

    const aiResp = await withTimeout(
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash", // default, fast & cost-effective
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          // Do not set temperature/max tokens to keep compatibility across providers
        }),
      }),
      35000,
    );

    if (!aiResp.ok) {
      // Surface rate-limit and credits issues to the client
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const data = await aiResp.json();
    console.log("AI response received");

    const generatedText: string = data?.choices?.[0]?.message?.content ?? "";

    // Parse JSON response
    let result: { subject: string; content: string } | null = null;
    try {
      result = JSON.parse(generatedText);
    } catch {
      // Fallback heuristic parsing if returned as plain text
      const lines = generatedText.split("\n");
      let subject = "";
      let content = "";
      let isBody = false;
      for (const line of lines) {
        if (line.toLowerCase().includes("subject:")) {
          subject = line.replace(/subject:\s*/i, "").trim();
        } else if (line.toLowerCase().includes("body:") || line.toLowerCase().includes("email:")) {
          isBody = true;
          continue;
        } else if (isBody || (!subject && line.trim())) {
          content += line + "\n";
        }
      }
      if (!subject) subject = `${(emailType || "Update").replace(/_/g, " ")}`.replace(/\b\w/g, (m) => m.toUpperCase());
      if (!content) content = generatedText || "";
      result = { subject: subject.trim(), content: content.trim() };
    }

    return new Response(
      JSON.stringify({
        subject: result?.subject || "Customer Update",
        content: result?.content || generatedText || "",
        originalPrompt: customPrompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in generate-customer-email function:", error);
    const status = error?.message === "timeout" ? 504 : 500;
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
