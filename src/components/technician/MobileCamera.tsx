import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileCameraProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
  photoType?: 'before' | 'after' | 'progress' | 'issue';
}

export const MobileCamera: React.FC<MobileCameraProps> = ({ 
  onCapture, 
  onClose,
  photoType = 'progress'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasCamera, setHasCamera] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setStream(mediaStream);
      setHasCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCamera(false);
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to take photos',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image as data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(photoDataUrl);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!hasCamera) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md">
          <h2 className="text-xl font-bold mb-4">Camera Not Available</h2>
          <p className="text-muted-foreground mb-6">
            Unable to access your device camera. Please check your browser permissions and try again.
          </p>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
        <span className="text-white font-medium capitalize">
          {photoType} Photo
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={switchCamera}
          className="text-white hover:bg-white/20"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay guides */}
        {!capturedImage && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/80">
        {!capturedImage ? (
          <div className="flex items-center justify-center">
            <Button
              onClick={capturePhoto}
              size="icon"
              className="h-20 w-20 rounded-full bg-white hover:bg-gray-200"
            >
              <Camera className="h-10 w-10 text-black" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={retakePhoto}
              size="lg"
              variant="outline"
              className="flex-1 h-14 text-base"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button
              onClick={confirmPhoto}
              size="lg"
              className="flex-1 h-14 text-base bg-green-600 hover:bg-green-700"
            >
              <Check className="h-5 w-5 mr-2" />
              Use Photo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
