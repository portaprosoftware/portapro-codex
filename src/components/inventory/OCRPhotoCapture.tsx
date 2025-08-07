import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Eye, Check, AlertCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface OCRPhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  itemCode: string;
  onComplete?: (ocrData: any) => void;
}

interface OCRResults {
  toolNumber: string | null;
  vendorId: string | null;
  plasticCode: string | null;
  manufacturingDate: string | null;
  moldCavity: string | null;
  rawData: any;
}

export const OCRPhotoCapture: React.FC<OCRPhotoCaptureProps> = ({
  open,
  onClose,
  itemId,
  itemCode,
  onComplete
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResults | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [manualOverrides, setManualOverrides] = useState<Partial<OCRResults>>({});

  const updateItemMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Saving OCR data:', data);
      
      // If itemId is "new", we're in create mode, just return the data
      if (itemId === "new") {
        console.log('In create mode, returning OCR data without saving');
        return data;
      }
      
      const { error } = await supabase
        .from('product_items')
        .update({
          tool_number: data.toolNumber,
          vendor_id: data.vendorId,
          plastic_code: data.plasticCode,
          manufacturing_date: data.manufacturingDate,
          mold_cavity: data.moldCavity,
          ocr_confidence_score: confidence,
          verification_status: 'auto_detected',
          ocr_raw_data: data.rawData,
          tracking_photo_url: data.photoUrl
        })
        .eq('id', itemId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('OCR data saved successfully');
      return data;
    },
    onSuccess: (data) => {
      console.log('Save mutation successful, invalidating queries');
      
      // Only invalidate queries if we're updating an existing item
      if (itemId !== "new") {
        queryClient.invalidateQueries({ queryKey: ['product-items'] });
        queryClient.invalidateQueries({ queryKey: ['product-items', itemId] });
      }
      
      const message = itemId === "new" 
        ? "OCR data captured successfully" 
        : `Tool tracking information updated for ${itemCode}`;
      
      toast({
        title: "✅ OCR Data Saved Successfully",
        description: message,
        duration: 4000,
      });
      
      // Call onComplete with the final data
      if (onComplete) {
        onComplete(data);
      }
      
      // Small delay to ensure user sees the success message
      setTimeout(() => {
        handleClose();
      }, 1000);
    },
    onError: (error) => {
      console.error('Save mutation failed:', error);
      
      toast({
        title: "❌ Save Failed",
        description: `Failed to save OCR data: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processOCR = async (imageBase64: string) => {
    try {
      setIsProcessing(true);
      
      // Remove data URL prefix for the API call
      const base64Data = imageBase64.split(',')[1];
      
      const response = await supabase.functions.invoke('ocr-tool-tracking', {
        body: {
          imageBase64: base64Data,
          itemId: itemId
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { results, confidence: ocrConfidence } = response.data;
      setOcrResults(results);
      setConfidence(ocrConfidence);
      
      toast({
        title: "OCR Processing Complete",
        description: `Processed with ${Math.round(ocrConfidence * 100)}% confidence`,
      });

    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: "OCR Processing Failed",
        description: "Failed to process image. You can still save manually entered data.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageCapture = async () => {
    if (!selectedImage) return;

    if (ocrEnabled) {
      await processOCR(selectedImage);
    }
  };

  const handleSave = () => {
    if (!selectedImage) return;

    console.log('Save triggered - manualOverrides:', manualOverrides);
    console.log('Save triggered - ocrResults:', ocrResults);

    // Helper function to prioritize manual input over OCR
    const getValueWithPriority = (manualValue: string | undefined, ocrValue: string | null | undefined) => {
      // If manual value exists and is not just whitespace, use it
      if (manualValue !== undefined && manualValue.trim() !== '') {
        return manualValue.trim();
      }
      // Otherwise fall back to OCR value
      return ocrValue || null;
    };

    const finalData = {
      toolNumber: getValueWithPriority(manualOverrides.toolNumber, ocrResults?.toolNumber),
      vendorId: getValueWithPriority(manualOverrides.vendorId, ocrResults?.vendorId),
      plasticCode: getValueWithPriority(manualOverrides.plasticCode, ocrResults?.plasticCode),
      manufacturingDate: getValueWithPriority(manualOverrides.manufacturingDate, ocrResults?.manufacturingDate),
      moldCavity: getValueWithPriority(manualOverrides.moldCavity, ocrResults?.moldCavity),
      rawData: ocrResults?.rawData,
      photoUrl: `tracking_photo_${itemId}_${Date.now()}.jpg`
    };

    console.log('Final data being saved:', finalData);
    updateItemMutation.mutate(finalData);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setOcrResults(null);
    setConfidence(0);
    setManualOverrides({});
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getConfidenceBadge = (conf: number) => {
    if (conf >= 0.8) return <Badge className="bg-green-100 text-green-700">High Confidence</Badge>;
    if (conf >= 0.6) return <Badge className="bg-yellow-100 text-yellow-700">Medium Confidence</Badge>;
    return <Badge className="bg-red-100 text-red-700">Low Confidence</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>OCR Tool Tracking - {itemCode}</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* OCR Settings */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="ocr-enabled"
                checked={ocrEnabled}
                onCheckedChange={setOcrEnabled}
              />
              <Label htmlFor="ocr-enabled">Enable OCR Processing</Label>
            </div>
            {ocrEnabled && (
              <Badge variant="outline" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Auto-detect tool numbers
              </Badge>
            )}
          </div>

          {/* Hidden file input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Photo capture section */}
          {selectedImage ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Captured"
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {!ocrResults && ocrEnabled && (
                <Button
                  onClick={handleImageCapture}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing OCR...' : 'Process Image'}
                </Button>
              )}
            </div>
          ) : (
            <div 
              onClick={triggerFileInput}
              className="w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Camera className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                Tap to capture tool tracking photo
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Focus on molded numbers and markings
              </p>
            </div>
          )}

          {/* OCR Results */}
          {(ocrResults || !ocrEnabled) && selectedImage && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Tool Tracking Data</h3>
                  {ocrEnabled && confidence > 0 && getConfidenceBadge(confidence)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tool-number">Tool Number</Label>
                    <Input
                      id="tool-number"
                      placeholder="e.g., T-20788-1A"
                      value={manualOverrides.toolNumber ?? ocrResults?.toolNumber ?? ''}
                      onChange={(e) => {
                        console.log('Tool number manual edit:', e.target.value);
                        setManualOverrides(prev => ({
                          ...prev,
                          toolNumber: e.target.value
                        }));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor-id">Vendor ID</Label>
                    <Input
                      id="vendor-id"
                      placeholder="e.g., 32293"
                      value={manualOverrides.vendorId ?? ocrResults?.vendorId ?? ''}
                      onChange={(e) => setManualOverrides(prev => ({
                        ...prev,
                        vendorId: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plastic-code">Plastic Code</Label>
                    <Input
                      id="plastic-code"
                      placeholder="e.g., 2 HDPE"
                      value={manualOverrides.plasticCode ?? ocrResults?.plasticCode ?? ''}
                      onChange={(e) => setManualOverrides(prev => ({
                        ...prev,
                        plasticCode: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturing-date">Manufacturing Date</Label>
                    <Input
                      id="manufacturing-date"
                      placeholder="MM/YY or Date"
                      value={manualOverrides.manufacturingDate ?? ocrResults?.manufacturingDate ?? ''}
                      onChange={(e) => setManualOverrides(prev => ({
                        ...prev,
                        manufacturingDate: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mold-cavity">Mold Cavity/Shift</Label>
                    <Input
                      id="mold-cavity"
                      placeholder="Cavity or shift info"
                      value={manualOverrides.moldCavity ?? ocrResults?.moldCavity ?? ''}
                      onChange={(e) => setManualOverrides(prev => ({
                        ...prev,
                        moldCavity: e.target.value
                      }))}
                    />
                  </div>
                </div>

                {ocrEnabled && confidence < 0.6 && (
                  <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Low Confidence Detection</p>
                      <p className="text-yellow-700">Please verify and correct the detected values manually.</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateItemMutation.isPending}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {updateItemMutation.isPending ? 'Saving...' : 'Save Tracking Data'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={triggerFileInput}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};