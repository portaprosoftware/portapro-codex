import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Flashlight, Focus, RotateCcw, Check, X, Maximize, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MobilePWAOptimizedOCRProps {
  open: boolean;
  onClose: () => void;
  onImageCapture: (imageBase64: string) => void;
  itemCode: string;
}

export const MobilePWAOptimizedOCR: React.FC<MobilePWAOptimizedOCRProps> = ({
  open,
  onClose,
  onImageCapture,
  itemCode
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [
            {
              focusMode: 'continuous',
              exposureMode: 'continuous',
              whiteBalanceMode: 'continuous'
            }
          ] as any
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleFlashlight = async () => {
    if (!stream) return;

    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashlightOn }]
        } as any);
        setIsFlashlightOn(!isFlashlightOn);
      } else {
        toast({
          title: "Flashlight Unavailable",
          description: "Your device doesn't support flashlight control.",
        });
      }
    } catch (error) {
      console.error('Error toggling flashlight:', error);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageBase64);
    setShowGuidance(false);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowGuidance(true);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      onClose();
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "p-0 overflow-hidden",
        isFullscreen ? "w-screen h-screen max-w-none max-h-none" : "sm:max-w-[500px] max-h-[90vh]"
      )}>
        <div className="relative bg-black">
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-black/80 text-white p-4">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Tool Tracking - {itemCode}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Camera View */}
          <div className="relative aspect-[4/3] min-h-[400px]">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Guidance Overlay */}
                {showGuidance && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 text-white p-6 rounded-lg max-w-sm mx-4 text-center space-y-4">
                      <Target className="w-12 h-12 mx-auto text-blue-400" />
                      <div>
                        <h3 className="font-semibold mb-2">OCR Capture Tips</h3>
                        <ul className="text-sm space-y-1">
                          <li>• Focus on molded numbers</li>
                          <li>• Ensure good lighting</li>
                          <li>• Hold steady for clarity</li>
                          <li>• Capture vendor ID areas</li>
                        </ul>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowGuidance(false)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Got it
                      </Button>
                    </div>
                  </div>
                )}

                {/* Focus Target Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-32 border-2 border-white border-dashed rounded-lg opacity-60">
                      <div className="absolute -top-6 left-0 text-white text-xs bg-black/60 px-2 py-1 rounded">
                        Tool Number Area
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
            {!capturedImage ? (
              <div className="flex items-center justify-between">
                {/* Flashlight */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFlashlight}
                  className={cn(
                    "text-white hover:bg-white/20",
                    isFlashlightOn && "bg-yellow-600 hover:bg-yellow-700"
                  )}
                >
                  <Flashlight className="h-5 w-5" />
                </Button>

                {/* Capture Button */}
                <Button
                  size="lg"
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black"
                >
                  <Camera className="h-6 w-6" />
                </Button>

                {/* Settings/Focus */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Focus className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={confirmPhoto}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Use This Photo
                </Button>
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className="absolute top-20 right-4 space-y-2">
            {isFlashlightOn && (
              <Badge className="bg-yellow-600 text-white">
                <Flashlight className="w-3 h-3 mr-1" />
                Flash On
              </Badge>
            )}
            {stream && (
              <Badge className="bg-green-600 text-white">
                <Camera className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};