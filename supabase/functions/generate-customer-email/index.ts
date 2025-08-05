import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailType, tone, customPrompt } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build comprehensive prompt with typo correction
    const systemPrompt = `You are an expert email assistant for a portable toilet rental company. Always correct any spelling or grammar mistakes in the user's text before rewriting. Create professional, ready-to-send emails that maintain the user's original intent while fixing any errors.`;

    const userPrompt = `First correct any spelling or grammar errors in the following text, then rewrite it as a ready-to-send email in a ${tone} tone for a ${emailType} email.

User input (may contain typos): "${customPrompt}"

Please generate:
1. An appropriate subject line
2. A complete email body that incorporates the corrected user input

The email should be professional yet ${tone}, appropriate for our portable toilet rental business, and ready to send to a customer.`;

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parse the response to extract subject and body
    const lines = generatedText.split('\n');
    let subject = '';
    let content = '';
    let isBody = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('subject:')) {
        subject = line.replace(/subject:\s*/i, '').trim();
      } else if (line.toLowerCase().includes('body:') || line.toLowerCase().includes('email:')) {
        isBody = true;
        continue;
      } else if (isBody || (!subject && line.trim())) {
        content += line + '\n';
      }
    }

    // If parsing fails, use the entire response as content and generate a simple subject
    if (!subject) {
      subject = `${emailType.charAt(0).toUpperCase() + emailType.slice(1)} - Important Update`;
      content = generatedText;
    }

    content = content.trim();

    console.log('Email generated successfully');

    return new Response(JSON.stringify({ 
      subject: subject.trim(),
      content: content,
      originalPrompt: customPrompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-customer-email function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});