import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  type: 'email' | 'sms' | 'both';
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

    // Helper function to truncate SMS and add read more link
    const truncateSMSWithReadMore = (content: string, customerPortalUrl: string = "your-portal.com") => {
      const maxLength = 120; // Leave room for "Read more: [link]"
      if (content.length <= maxLength) {
        return content;
      }
      
      const truncated = content.substring(0, maxLength).trim();
      const readMoreLink = `Read more: ${customerPortalUrl}/campaign/{{campaign_id}}`;
      return `${truncated}... ${readMoreLink}`;
    };

    if (type === 'both') {
      // Generate both email and SMS content
      const emailSystemPrompt = `You are an expert marketing copywriter specializing in customer communications for service businesses. Generate professional email content that is engaging, clear, and action-oriented.`;
      
      const emailUserPrompt = `Generate a subject line and email content for a ${emailType || 'marketing'} campaign with a ${tone} tone.

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Return ONLY valid JSON with "subject" and "content" fields. Do not wrap in markdown code blocks. Example: {"subject": "Your subject here", "content": "Your email content here"}

Keep the content engaging and include a clear call-to-action.`;

      const smsSystemPrompt = `You are an expert at writing concise, effective SMS messages for business communications. Generate a brief SMS version of the email content.`;
      
      const smsUserPrompt = `Based on the email campaign content, generate a concise SMS message with a ${tone} tone that captures the key message.

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Keep it under 120 characters to allow room for a "read more" link. Focus on the most important message and call-to-action.`;

      // Generate email content first
      const emailResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: emailSystemPrompt },
            { role: 'user', content: emailUserPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error(`OpenAI API error for email: ${emailResponse.statusText}`);
      }

      const emailData = await emailResponse.json();
      const emailContent = emailData.choices[0].message.content;

      // Generate SMS content
      const smsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: smsSystemPrompt },
            { role: 'user', content: smsUserPrompt }
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
      });

      if (!smsResponse.ok) {
        throw new Error(`OpenAI API error for SMS: ${smsResponse.statusText}`);
      }

      const smsData = await smsResponse.json();
      const smsContentRaw = smsData.choices[0].message.content;

      // Process email content
      const extractJSON = (content: string) => {
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          return jsonMatch[1];
        }
        return content.trim();
      };

      let emailResult;
      try {
        const cleanedEmailContent = extractJSON(emailContent);
        emailResult = JSON.parse(cleanedEmailContent);
        
        if (!emailResult.subject || !emailResult.content) {
          throw new Error('Missing required fields');
        }
      } catch (error) {
        console.error('JSON parsing error for email:', error);
        const lines = emailContent.split('\n').filter(line => line.trim());
        emailResult = {
          subject: lines.find(line => line.toLowerCase().includes('subject')) || 'Important Update from Our Team',
          content: emailContent
        };
      }

      // Process SMS content and add read more link if needed
      const smsContent = truncateSMSWithReadMore(smsContentRaw);

      return new Response(JSON.stringify({
        email: emailResult,
        sms: { content: smsContent }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'email') {
      systemPrompt = `You are an expert marketing copywriter specializing in customer communications for service businesses. Generate professional email content that is engaging, clear, and action-oriented.`;
      
      userPrompt = `Generate ${includeSubject ? 'a subject line and' : ''} email content for a ${emailType || 'marketing'} campaign with a ${tone} tone.

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

${includeSubject ? 'Return ONLY valid JSON with "subject" and "content" fields. Do not wrap in markdown code blocks. Example: {"subject": "Your subject here", "content": "Your email content here"}' : 'Return only the email body content as plain text.'}

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
        max_tokens: type === 'sms' ? 200 : 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Function to extract JSON from markdown code blocks
    const extractJSON = (content: string) => {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        return jsonMatch[1];
      }
      // If no code blocks, return original content
      return content.trim();
    };

    let result;
    if (type === 'email' && includeSubject) {
      try {
        const cleanedContent = extractJSON(generatedContent);
        result = JSON.parse(cleanedContent);
        
        // Validate the result has required fields
        if (!result.subject || !result.content) {
          throw new Error('Missing required fields');
        }
      } catch (error) {
        console.error('JSON parsing error:', error);
        // Improved fallback parsing
        const lines = generatedContent.split('\n').filter(line => line.trim());
        result = {
          subject: lines.find(line => line.toLowerCase().includes('subject')) || 'Important Update from Our Team',
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