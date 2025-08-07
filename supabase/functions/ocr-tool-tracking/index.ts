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
      // Preprocess image for better OCR results
      const processedImageBase64 = await preprocessImage(imageBase64);
      
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
                  content: processedImageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 50
                  },
                  {
                    type: 'DOCUMENT_TEXT_DETECTION',
                    maxResults: 50
                  }
                ],
                imageContext: {
                  textDetectionParams: {
                    enableTextDetectionConfidenceScore: true
                  },
                  languageHints: ['en']
                }
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
          const documentText = visionData.responses[0]?.fullTextAnnotation?.text || '';
          
          console.log('=== OCR DEBUGGING ===');
          console.log('Raw Vision API response structure:');
          console.log('- Text annotations count:', textAnnotations.length);
          console.log('- Document text available:', !!documentText);
          console.log('- Full response keys:', Object.keys(visionData.responses[0] || {}));
          
          if (textAnnotations.length > 0) {
            console.log('First 5 text annotations:');
            textAnnotations.slice(0, 5).forEach((annotation, i) => {
              console.log(`  ${i + 1}:`, {
                text: annotation.description?.substring(0, 50),
                confidence: annotation.score,
                boundingPoly: !!annotation.boundingPoly
              });
            });
          }

          // Extract all detected text with preference for document text
          const fullText = documentText || textAnnotations.map(annotation => annotation.description).join(' ');

          console.log('=== TEXT EXTRACTION ===');
          console.log('Full detected text length:', fullText.length);
          console.log('Full detected text preview:', fullText.substring(0, 200));
          console.log('Text contains numbers:', /\d/.test(fullText));
          console.log('Text contains letters:', /[a-zA-Z]/.test(fullText));

          // Parse OCR results with enhanced regex patterns
          console.log('=== PATTERN MATCHING ===');
          const extractedData = {
            toolNumber: extractToolNumber(fullText),
            vendorId: extractVendorId(fullText),
            plasticCode: extractPlasticCode(fullText),
            manufacturingDate: extractManufacturingDate(fullText),
            moldCavity: extractMoldCavity(fullText)
          };
          
          console.log('Extraction results:', extractedData);
          
          ocrResults = {
            ...extractedData,
            rawData: {
              fullText,
              documentText,
              annotations: textAnnotations.slice(0, 10), // Limit raw data size
              totalAnnotations: textAnnotations.length,
              hasDocumentText: !!documentText
            }
          };

          // Calculate confidence score (average of all text confidences)
          const confidenceScores = textAnnotations
            .filter(t => t.score !== undefined)
            .map(t => t.score || 0);
          
          avgConfidence = confidenceScores.length > 0 
            ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
            : (fullText.length > 0 ? 0.5 : 0); // Assign medium confidence if text found but no scores
            
          console.log(`=== FINAL RESULTS ===`);
          console.log(`Found ${Object.values(extractedData).filter(v => v && v !== null).length} fields`);
          console.log(`Confidence: ${avgConfidence.toFixed(2)}`);
          console.log(`Text quality: ${fullText.length > 10 ? 'Good' : 'Poor'} (${fullText.length} chars)`);
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

// Image preprocessing function
async function preprocessImage(imageBase64: string): Promise<string> {
  try {
    // For now, return the original image
    // In future, could implement contrast/brightness enhancement here
    console.log('Image preprocessing: Using original image (enhancement not implemented)');
    return imageBase64;
  } catch (error) {
    console.log('Image preprocessing failed, using original:', error.message);
    return imageBase64;
  }
}

// Helper functions for text extraction with enhanced patterns
function extractToolNumber(text: string): string | null {
  console.log('Searching for tool number in:', text.substring(0, 100));
  
  // Enhanced patterns for tool numbers
  const patterns = [
    /T-\d{5}-\w+/gi,
    /TOOL[\s#:]*(\d{4,})/gi,
    /TL[\s#:]*(\d{4,})/gi,
    /\bT\d{4,}/gi,
    /\b\d{5,}-\w+/gi, // Generic number-letter combos
    /\b[A-Z]{1,3}[-\s]*\d{4,}/gi // Letter prefix with numbers
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      console.log('Tool number pattern matched:', pattern, 'Result:', matches[0]);
      return matches[0].trim().toUpperCase();
    }
  }
  
  console.log('No tool number patterns matched');
  return null;
}

function extractVendorId(text: string): string | null {
  console.log('Searching for vendor ID in:', text.substring(0, 100));
  
  // Enhanced patterns for vendor IDs
  const patterns = [
    /VENDOR\s*ID[\s#:]*(\d+)/gi,
    /VID[\s#:]*(\d+)/gi,
    /V[\s#:]*(\d{4,})/gi,
    /ID[\s#:]*(\d{4,})/gi,
    /\b\d{5,}\b/g // Standalone 5+ digit numbers
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      const result = matches[0].replace(/\D/g, ''); // Extract just numbers
      if (result.length >= 4) {
        console.log('Vendor ID pattern matched:', pattern, 'Result:', result);
        return result;
      }
    }
  }
  
  console.log('No vendor ID patterns matched');
  return null;
}

function extractPlasticCode(text: string): string | null {
  console.log('Searching for plastic code in:', text.substring(0, 100));
  
  // Enhanced patterns for plastic/recycling codes
  const patterns = [
    /♺?\s*(\d+)\s*(HDPE|PP|PE|PVC|PS|PC|ABS|PET)/gi,
    /(\d+)\s*(HDPE|PP|PE|PVC|PS|PC|ABS|PET)/gi,
    /♺\s*(\d+)/gi, // Just recycling symbol with number
    /RESIN\s*(\d+)/gi,
    /PLASTIC\s*(\d+)/gi
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      console.log('Plastic code pattern matched:', pattern, 'Result:', matches[0]);
      return matches[0].trim().toUpperCase();
    }
  }
  
  console.log('No plastic code patterns matched');
  return null;
}

function extractManufacturingDate(text: string): string | null {
  console.log('Searching for manufacturing date in:', text.substring(0, 100));
  
  // Enhanced patterns for dates including circular dial patterns
  const patterns = [
    /\b(0?[1-9]|1[0-2])[\/\-\.](20)?\d{2}\b/g, // MM/YY, MM/YYYY, MM.YY
    /\b(20)?\d{2}[\/\-\.](0?[1-9]|1[0-2])\b/g,  // YY/MM, YYYY/MM, YY.MM
    /\b\d{2}\/\d{2}\b/g, // Any XX/XX pattern
    /\b\d{4}\b/g, // 4-digit years
    /MFG[\s:]*(\d{1,2}[\/-]\d{2,4})/gi,
    /DATE[\s:]*(\d{1,2}[\/-]\d{2,4})/gi
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      console.log('Date pattern matched:', pattern, 'Result:', matches[0]);
      return matches[0];
    }
  }
  
  console.log('No date patterns matched');
  return null;
}

function extractMoldCavity(text: string): string | null {
  console.log('Searching for mold cavity in:', text.substring(0, 100));
  
  // Enhanced patterns for cavity or shift information
  const patterns = [
    /CAVITY[\s#:]*(\d+)/gi,
    /CAV[\s#:]*(\d+)/gi,
    /SHIFT[\s#:]*(\d+)/gi,
    /MOLD[\s#:]*(\d+)/gi,
    /\bC[\s#:]*(\d+)/gi, // Just "C" followed by number
    /\bS[\s#:]*(\d+)/gi  // Just "S" followed by number
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      console.log('Mold cavity pattern matched:', pattern, 'Result:', matches[0]);
      return matches[0].trim().toUpperCase();
    }
  }
  
  console.log('No mold cavity patterns matched');
  return null;
}