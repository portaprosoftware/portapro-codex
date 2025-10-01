import React, { useRef, useState } from "react";
import { Camera, Upload, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface PhotoCaptureProps {
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  initialPhotos?: string[];
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotosChange,
  maxPhotos = 5,
  initialPhotos = []
}) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" } // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          addPhoto(base64);
        };
        reader.readAsDataURL(blob);
      }
    }, "image/jpeg", 0.8);

    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          addPhoto(base64);
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addPhoto = (photoData: string) => {
    if (photos.length >= maxPhotos) {
      toast({
        title: "Photo Limit Reached",
        description: `Maximum ${maxPhotos} photos allowed.`,
        variant: "destructive"
      });
      return;
    }

    const newPhotos = [...photos, photoData];
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
    
    toast({
      title: "Photo Added",
      description: "Photo successfully captured.",
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  const canAddMorePhotos = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <Card key={index} className="relative">
              <CardContent className="p-2">
                <img
                  src={photo}
                  alt={`Spill kit photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Camera View */}
      {isCapturing && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-64 object-cover rounded"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button
                  type="button"
                  onClick={capturePhoto}
                  className="rounded-full h-12 w-12 p-0"
                >
                  <Check className="h-6 w-6" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={stopCamera}
                  className="rounded-full h-12 w-12 p-0"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canAddMorePhotos && !isCapturing && (
        <div className="grid grid-cols-2 gap-2 max-w-4xl">
          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            className="justify-center"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="justify-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Photo count indicator */}
      <p className="text-sm text-muted-foreground text-center">
        {photos.length} / {maxPhotos} photos
      </p>
    </div>
  );
};