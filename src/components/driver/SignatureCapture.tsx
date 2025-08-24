import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, RotateCcw, Save, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isMobile, getOrientation } from '@/utils/mobileUtils';

interface SignatureCaptureProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  onComplete?: (signatureUrl: string) => void;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  open,
  onClose,
  jobId,
  onComplete
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showOrientationPrompt, setShowOrientationPrompt] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, []);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    setIsSaving(true);
    try {
      const dataURL = canvas.toDataURL('image/png');
      
      // TODO: Implement actual signature upload to Supabase Storage
      // For now, just simulate save and return a URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockSignatureUrl = `signature_${Date.now()}.png`;
      
      toast({
        title: "Signature Saved",
        description: "Customer signature has been captured",
      });
      
      // Call the completion callback if provided
      if (onComplete) {
        onComplete(mockSignatureUrl);
      }
      
      handleClose();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save signature. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    clearSignature();
    setShowOrientationPrompt(false);
    setIsReady(false);
    onClose();
  };

  // Monitor orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const currentOrientation = getOrientation();
      setOrientation(currentOrientation);
      
      if (isMobile() && currentOrientation === 'landscape') {
        setShowOrientationPrompt(false);
        setIsReady(true);
      }
    };

    // Initial check
    handleOrientationChange();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Show orientation prompt on mobile when modal opens
  useEffect(() => {
    if (open && isMobile()) {
      const currentOrientation = getOrientation();
      if (currentOrientation === 'portrait') {
        setShowOrientationPrompt(true);
        setIsReady(false);
      } else {
        setShowOrientationPrompt(false);
        setIsReady(true);
      }
    } else if (open && !isMobile()) {
      // Desktop - skip orientation prompt
      setShowOrientationPrompt(false);
      setIsReady(true);
    }
  }, [open]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) return;

    // Adjust canvas size based on orientation and device
    const isMobileDevice = isMobile();
    const isLandscape = orientation === 'landscape';
    
    if (isMobileDevice && isLandscape) {
      // Mobile landscape - use full width
      canvas.width = Math.min(window.innerWidth - 40, 600);
      canvas.height = 200;
    } else if (isMobileDevice) {
      // Mobile portrait
      canvas.width = 350;
      canvas.height = 150;
    } else {
      // Desktop
      canvas.width = 500;
      canvas.height = 200;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = isMobileDevice ? 3 : 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [open, isReady, orientation]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`${isMobile() && orientation === 'landscape' ? 'sm:max-w-[90vw] h-[90vh]' : 'sm:max-w-[425px]'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Customer Signature</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Orientation Prompt for Mobile */}
        {showOrientationPrompt && isMobile() && (
          <div className="space-y-4 text-center py-8">
            <div className="flex justify-center mb-4">
              <RotateCw className="w-16 h-16 text-blue-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold">Rotate Your Device</h3>
            <p className="text-sm text-muted-foreground">
              Please turn your phone sideways for a better signing experience
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowOrientationPrompt(false);
                setIsReady(true);
              }}
              className="mt-4"
            >
              Continue in Portrait
            </Button>
          </div>
        )}

        {/* Signature Interface */}
        {isReady && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isMobile() && orientation === 'landscape' 
                ? "Perfect! You now have more space to sign. Please ask the customer to sign below."
                : "Please ask the customer to sign below"
              }
            </p>

            {/* Signature Canvas */}
            <div className="border rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ 
                  backgroundColor: '#fafafa',
                  height: isMobile() && orientation === 'landscape' ? '200px' : '150px'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className={`flex space-x-2 ${isMobile() && orientation === 'landscape' ? 'justify-center' : ''}`}>
              <Button
                variant="outline"
                onClick={clearSignature}
                disabled={!hasSignature}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
              
              <Button
                onClick={saveSignature}
                disabled={!hasSignature || isSaving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>

            {isMobile() && orientation === 'portrait' && (
              <div className="text-center">
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setShowOrientationPrompt(true)}
                  className="text-xs text-muted-foreground"
                >
                  Want more space? Rotate your device →
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};