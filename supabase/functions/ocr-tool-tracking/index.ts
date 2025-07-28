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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const googleCloudVisionKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    const { imageBase64, itemId } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image data required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing OCR for item:', itemId);

    let ocrResults;
    let avgConfidence;

    if (!googleCloudVisionKey) {
      console.log('Google Cloud Vision API key not configured, using mock data');
      
      // Generate realistic mock OCR data for testing
      const mockData = {
        toolNumber: `T-${Math.floor(Math.random() * 90000) + 10000}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 10)}`,
        vendorId: String(Math.floor(Math.random() * 90000) + 10000),
        plasticCode: Math.random() > 0.5 ? '2 HDPE' : '5 PP',
        manufacturingDate: `${Math.floor(Math.random() * 12) + 1}/24`,
        moldCavity: `CAV ${Math.floor(Math.random() * 8) + 1}`
      };
      
      ocrResults = {
        ...mockData,
        rawData: {
          fullText: `Mock detected: ${mockData.toolNumber} ${mockData.vendorId} ${mockData.plasticCode} ${mockData.manufacturingDate} ${mockData.moldCavity}`,
          annotations: [{
            description: mockData.toolNumber,
            confidence: 0.95
          }, {
            description: mockData.vendorId,
            confidence: 0.88
          }]
        }
      };
      avgConfidence = 0.85 + Math.random() * 0.1;
    } else {
      // Real Google Cloud Vision API processing
      const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleCloudVisionKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
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
      ocrResults = {
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
      
      avgConfidence = confidenceScores.length > 0 
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;
    }

    console.log('Parsed OCR results:', ocrResults);
    console.log('Average confidence:', avgConfidence);

    // Update the product item in the database if itemId is provided
    if (itemId) {
      const updateData: any = {
        ocr_confidence_score: avgConfidence,
        verification_status: 'auto_detected',
        ocr_raw_data: ocrResults.rawData,
        updated_at: new Date().toISOString()
      };

      if (ocrResults.toolNumber) updateData.tool_number = ocrResults.toolNumber;
      if (ocrResults.vendorId) updateData.vendor_id = ocrResults.vendorId;
      if (ocrResults.plasticCode) updateData.plastic_code = ocrResults.plasticCode;
      if (ocrResults.manufacturingDate) {
        // Convert simple date format to ISO date
        const dateStr = ocrResults.manufacturingDate;
        if (dateStr.includes('/')) {
          const [month, year] = dateStr.split('/');
          const fullYear = year.length === 2 ? `20${year}` : year;
          updateData.manufacturing_date = `${fullYear}-${month.padStart(2, '0')}-01`;
        }
      }

      const { error: updateError } = await supabase
        .from('product_items')
        .update(updateData)
        .eq('id', itemId);

      if (updateError) {
        console.error('Error updating product item:', updateError);
      } else {
        console.log('Product item updated successfully');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results: ocrResults,
      confidence: avgConfidence,
      detectedTextCount: ocrResults.rawData.annotations?.length || 0,
      mock: !googleCloudVisionKey
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