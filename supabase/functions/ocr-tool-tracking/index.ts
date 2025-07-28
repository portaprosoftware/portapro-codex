import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const googleCloudVisionKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!googleCloudVisionKey) {
      throw new Error('Google Cloud Vision API key not configured');
    }

    const { imageBase64, itemId } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image data required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing OCR for item:', itemId);

    // Call Google Cloud Vision API
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleCloudVisionKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: imageBase64
          },
          features: [{
            type: 'TEXT_DETECTION',
            maxResults: 50
          }]
        }]
      })
    });

    if (!visionResponse.ok) {
      throw new Error(`Vision API error: ${visionResponse.statusText}`);
    }

    const visionData = await visionResponse.json();
    const textAnnotations = visionData.responses[0]?.textAnnotations || [];

    console.log('Detected text annotations:', textAnnotations.length);

    // Extract all detected text
    const detectedTexts = textAnnotations.map(annotation => annotation.description);
    const fullText = detectedTexts.join(' ');

    console.log('Full detected text:', fullText);

    // Parse OCR results with regex patterns
    const ocrResults = {
      toolNumber: extractToolNumber(fullText),
      vendorId: extractVendorId(fullText),
      plasticCode: extractPlasticCode(fullText),
      manufacturingDate: extractManufacturingDate(fullText),
      moldCavity: extractMoldCavity(fullText),
      rawData: {
        fullText,
        annotations: textAnnotations.slice(0, 10) // Limit raw data size
      }
    };

    // Calculate confidence score (average of all text confidences)
    const confidenceScores = textAnnotations
      .filter(t => t.score !== undefined)
      .map(t => t.score || 0);
    
    const avgConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0;

    console.log('Parsed OCR results:', ocrResults);
    console.log('Average confidence:', avgConfidence);

    return new Response(JSON.stringify({
      success: true,
      results: ocrResults,
      confidence: avgConfidence,
      detectedTextCount: textAnnotations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions for text extraction
function extractToolNumber(text: string): string | null {
  // Look for patterns like "T-20788-1A", "TOOL 12345", etc.
  const patterns = [
    /T-\d{5}-\w+/gi,
    /TOOL[\s#]*(\d{5,})/gi,
    /TL[\s#]*(\d{4,})/gi
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('Tool number found:', match[0]);
      return match[0].trim().toUpperCase();
    }
  }
  return null;
}

function extractVendorId(text: string): string | null {
  // Look for vendor ID patterns
  const patterns = [
    /VENDOR\s*ID[\s#]*(\d+)/gi,
    /VID[\s#]*(\d+)/gi,
    /(?:^|\s)(\d{5,})(?:\s|$)/g // Standalone 5+ digit numbers
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('Vendor ID found:', match[0]);
      return match[0].replace(/\D/g, ''); // Extract just numbers
    }
  }
  return null;
}

function extractPlasticCode(text: string): string | null {
  // Look for recycling codes like "2 HDPE", "♺ 2 HDPE"
  const patterns = [
    /♺?\s*(\d+)\s*(HDPE|PP|PE|PVC|PS|PC)/gi,
    /(\d+)\s*(HDPE|PP|PE|PVC|PS|PC)/gi
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('Plastic code found:', match[0]);
      return match[0].trim().toUpperCase();
    }
  }
  return null;
}

function extractManufacturingDate(text: string): string | null {
  // Look for date patterns - this is complex for circular dials
  // For now, look for simple date patterns
  const patterns = [
    /\b(0?[1-9]|1[0-2])[\/\-](20)?\d{2}\b/g, // MM/YY or MM/YYYY
    /\b(20)?\d{2}[\/\-](0?[1-9]|1[0-2])\b/g  // YY/MM or YYYY/MM
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('Date found:', match[0]);
      return match[0];
    }
  }
  return null;
}

function extractMoldCavity(text: string): string | null {
  // Look for cavity or shift information
  const patterns = [
    /CAVITY[\s#]*(\d+)/gi,
    /CAV[\s#]*(\d+)/gi,
    /SHIFT[\s#]*(\d+)/gi
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('Mold cavity found:', match[0]);
      return match[0].trim().toUpperCase();
    }
  }
  return null;
}