import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface OCRSearchCaptureProps {
  open: boolean;
  onClose: () => void;
  onSearchResult: (searchTerm: string, confidence?: number) => void;
}

interface OCRResults {
  toolNumber: string | null;
  vendorId: string | null;
  plasticCode: string | null;
  manufacturingDate: string | null;
  moldCavity: string | null;
}

export const OCRSearchCapture: React.FC<OCRSearchCaptureProps> = ({
  open,
  onClose,
  onSearchResult
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResults | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [manualOverride, setManualOverride] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setSelectedImage(imageDataUrl);
        handleImageCapture(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Failed",
        description: "Could not access camera. Please use the Upload option instead.",
        variant: "destructive",
      });
      // Fallback to file upload
      handleFileUpload();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setSelectedImage(imageDataUrl);
        handleImageCapture(imageDataUrl);
        stopCamera();
      }
    }
  };

  const handleCameraCapture = () => {
    startCamera();
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processOCR = async (imageBase64: string) => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('ocr-tool-tracking', {
        body: {
          imageBase64: imageBase64.split(',')[1], // Remove data:image/jpeg;base64, prefix
          itemId: null // We're not saving to database, just extracting
        }
      });

      if (error) throw error;

      if (data.success) {
        setOcrResults(data.results);
        setConfidence(data.confidence || 0);
        
        // Auto-populate manual override with the most likely tool number
        if (data.results.toolNumber) {
          setManualOverride(data.results.toolNumber);
        }
        
        toast({
          title: "OCR Processing Complete",
          description: `Extracted tool number with ${Math.round((data.confidence || 0) * 100)}% confidence`,
        });
      } else {
        throw new Error(data.error || 'OCR processing failed');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: "OCR Processing Failed",
        description: "Could not extract tool number from image. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageCapture = async (imageDataUrl: string) => {
    await processOCR(imageDataUrl);
  };

  const handleSearch = () => {
    const searchTerm = manualOverride || ocrResults?.toolNumber || '';
    if (searchTerm.trim()) {
      onSearchResult(searchTerm.trim(), confidence);
      handleClose();
      toast({
        title: "Search Applied",
        description: `Searching for tool number: ${searchTerm}`,
      });
    } else {
      toast({
        title: "No Search Term",
        description: "Please capture an image or enter a tool number manually.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setOcrResults(null);
    setConfidence(0);
    setManualOverride('');
    setIsProcessing(false);
    stopCamera(); // Stop camera when closing
    onClose();
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setOcrResults(null);
    setConfidence(0);
    setManualOverride('');
    // Trigger camera capture for retake
    handleCameraCapture();
  };

  const getConfidenceBadge = (conf: number) => {
    if (conf >= 0.8) return <Badge variant="default" className="bg-green-100 text-green-800">High Confidence</Badge>;
    if (conf >= 0.5) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
    return <Badge variant="destructive" className="bg-red-100 text-red-800">Low Confidence</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search by Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {showCamera ? (
            // Camera View
            <div className="text-center space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover rounded-lg border bg-black"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={capturePhoto}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Camera className="w-4 h-4" />
                  Capture
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : !selectedImage ? (
            // Initial Options
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Take a photo of the tool number to search your inventory
              </p>
              
              {/* File Input - for uploading files */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleCameraCapture}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
                
                <Button
                  onClick={handleFileUpload}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img 
                  src={selectedImage} 
                  alt="Captured tool" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  onClick={handleRetake}
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Processing State */}
              {isProcessing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Processing image...</p>
                </div>
              )}

              {/* OCR Results */}
              {ocrResults && !isProcessing && (
                <div className="space-y-3">
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">OCR Results</Label>
                    {getConfidenceBadge(confidence)}
                  </div>

                  {ocrResults.toolNumber && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Tool Number Detected</span>
                      </div>
                      <p className="text-lg font-mono bg-white p-2 rounded border">
                        {ocrResults.toolNumber}
                      </p>
                    </div>
                  )}

                  {/* Manual Override */}
                  <div className="space-y-2">
                    <Label htmlFor="manual-tool-number" className="text-sm">
                      Tool Number (Edit if needed)
                    </Label>
                    <Input
                      id="manual-tool-number"
                      value={manualOverride}
                      onChange={(e) => setManualOverride(e.target.value)}
                      placeholder="Enter or correct tool number"
                      className="font-mono"
                    />
                  </div>

                  {confidence < 0.5 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Low confidence detection. Please verify the tool number above.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSearch}
                  disabled={isProcessing || (!ocrResults?.toolNumber && !manualOverride.trim())}
                  className="flex-1"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button onClick={handleRetake} variant="outline">
                  Retake
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};