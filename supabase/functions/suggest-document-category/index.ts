import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, availableCategories } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing filename:', filename);

    const categoryList = availableCategories.map((cat: any) => 
      `- ${cat.name}: ${cat.description}`
    ).join('\n');

    const systemPrompt = `You are a document categorization assistant for a fleet management system. 
Analyze the filename and suggest the most appropriate category from the available options.
Consider common fleet document naming patterns, abbreviations, and industry standards.

Available categories:
${categoryList}

Return ONLY a JSON object with this structure:
{
  "category": "category name exactly as listed",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this filename: "${filename}"` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add funds to continue.');
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse the JSON response from AI
    let suggestion;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                       aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      suggestion = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback to a default response
      suggestion = {
        category: 'Other Documents',
        confidence: 0.3,
        reasoning: 'Could not determine specific category'
      };
    }

    console.log('AI suggestion:', suggestion);

    return new Response(
      JSON.stringify(suggestion),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in suggest-document-category:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        category: 'Other Documents',
        confidence: 0,
        reasoning: 'Error during analysis'
      }),
      { 
        status: error.message.includes('Rate limit') || error.message.includes('credits') ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
