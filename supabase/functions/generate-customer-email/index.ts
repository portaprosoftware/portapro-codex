import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailType, tone, customPrompt } = await req.json();

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
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

    console.log("Calling OpenAI API...");

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
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
