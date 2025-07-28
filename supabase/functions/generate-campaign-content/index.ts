import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  type: 'email' | 'sms';
  emailType?: 'marketing' | 'reminder' | 'follow_up' | 'announcement' | 'custom';
  tone: 'professional' | 'friendly' | 'urgent' | 'casual';
  customInstructions?: string;
  includeSubject?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { type, emailType, tone, customInstructions, includeSubject }: GenerateRequest = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'email') {
      systemPrompt = `You are an expert marketing copywriter specializing in customer communications for service businesses. Generate professional email content that is engaging, clear, and action-oriented.`;
      
      userPrompt = `Generate ${includeSubject ? 'a subject line and' : ''} email content for a ${emailType || 'marketing'} campaign with a ${tone} tone.

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

${includeSubject ? 'Format your response as JSON with "subject" and "content" fields.' : 'Return only the email body content as plain text.'}

Keep the content concise but engaging, and include a clear call-to-action.`;
    } else {
      systemPrompt = `You are an expert at writing concise, effective SMS messages for business communications. Messages should be under 160 characters when possible.`;
      
      userPrompt = `Generate an SMS message for a business with a ${tone} tone.

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Keep it brief, engaging, and include a clear call-to-action.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    let result;
    if (type === 'email' && includeSubject) {
      try {
        result = JSON.parse(generatedContent);
      } catch {
        // Fallback if JSON parsing fails
        result = {
          subject: 'Important Update from Our Team',
          content: generatedContent
        };
      }
    } else {
      result = { content: generatedContent };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-campaign-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});