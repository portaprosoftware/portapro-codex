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
      console.log('Google Cloud Vision API key not configured, returning empty results');
      
      // Return empty results instead of mock data when API key is not configured
      ocrResults = {
        toolNumber: null,
        vendorId: null,
        plasticCode: null,
        manufacturingDate: null,
        moldCavity: null,
        rawData: {
          fullText: 'No OCR processing - Google Cloud Vision API key not configured',
          annotations: []
        }
      };
      avgConfidence = 0;
    } else {
      // Real Google Cloud Vision API processing with retry logic
      let visionResponse;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`Attempting Vision API call (attempt ${retryCount + 1}/${maxRetries})`);
          
          visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleCloudVisionKey}`, {
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
          
          if (visionResponse.ok) {
            break; // Success, exit retry loop
          } else {
            throw new Error(`API returned ${visionResponse.status}: ${visionResponse.statusText}`);
          }
        } catch (error) {
          console.log(`Vision API attempt ${retryCount + 1} failed:`, error.message);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (!visionResponse || !visionResponse.ok) {
        const responseText = visionResponse ? await visionResponse.text() : 'No response received';
        const statusInfo = visionResponse ? `${visionResponse.status} ${visionResponse.statusText}` : 'Connection failed';
        console.log(`Vision API failed after ${maxRetries} attempts: ${statusInfo} - ${responseText}`);
        
        // Return empty results with detailed error info
        ocrResults = {
          toolNumber: null,
          vendorId: null,
          plasticCode: null,
          manufacturingDate: null,
          moldCavity: null,
          rawData: {
            fullText: `OCR processing failed after ${maxRetries} attempts: ${statusInfo}`,
            annotations: [],
            error: responseText,
            retriesAttempted: maxRetries
          }
        };
        avgConfidence = 0;
        
        console.log('OCR API failed after retries, returning empty results');
      } else {
        console.log('Vision API successful, processing response...');
        const visionData = await visionResponse.json();
        
        // Check for API errors in the response
        if (visionData.responses?.[0]?.error) {
          const apiError = visionData.responses[0].error;
          console.log('Vision API returned error in response:', apiError);
          
          ocrResults = {
            toolNumber: null,
            vendorId: null,
            plasticCode: null,
            manufacturingDate: null,
            moldCavity: null,
            rawData: {
              fullText: `OCR API error: ${apiError.message || 'Unknown error'}`,
              annotations: [],
              error: apiError
            }
          };
          avgConfidence = 0;
        } else {
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
            
          console.log(`OCR successful: Found ${Object.values(ocrResults).filter(v => v && v !== null).length - 1} fields with ${avgConfidence.toFixed(2)} confidence`);
        }
      }
    }

    console.log('Parsed OCR results:', ocrResults);
    console.log('Average confidence:', avgConfidence);

    // Update the product item in the database if itemId is provided and valid
    if (itemId && itemId !== 'new' && itemId !== 'undefined' && itemId !== 'null') {
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
        // Don't fail the entire request if DB update fails - still return OCR results
      } else {
        console.log('Product item updated successfully');
      }
    } else if (itemId) {
      console.log(`Skipping database update for itemId: ${itemId} (new item or invalid UUID)`);
    }

    return new Response(JSON.stringify({
      success: true,
      results: ocrResults,
      confidence: avgConfidence,
      detectedTextCount: ocrResults.rawData.annotations?.length || 0,
      apiConfigured: !!googleCloudVisionKey,
      apiError: ocrResults.rawData.error || null
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