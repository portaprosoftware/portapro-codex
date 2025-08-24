import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  onComplete?: (photoUrl: string) => void;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  open,
  onClose,
  jobId,
  onComplete
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      // TODO: Implement actual file upload to Supabase Storage
      // For now, just simulate upload and return a URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockPhotoUrl = `photo_${Date.now()}.jpg`;
      
      toast({
        title: "Photo Uploaded",
        description: "Job photo has been saved successfully",
      });
      
      // Call the completion callback if provided
      if (onComplete) {
        onComplete(mockPhotoUrl);
      }
      
      handleClose();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    onClose();
  };

  const triggerFileInput = (useCamera = false) => {
    if (fileInputRef.current) {
      // Set capture attribute based on the option
      fileInputRef.current.setAttribute('capture', useCamera ? 'environment' : '');
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden file input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Photo preview or camera trigger */}
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
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Save Photo'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => triggerFileInput(true)}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Retake
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Two photo options */}
              <div className="grid grid-cols-1 gap-3">
                {/* Take Photo Option */}
                <div 
                  onClick={() => triggerFileInput(true)}
                  className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Take a Photo
                  </p>
                </div>

                {/* Upload from Album Option */}
                <div 
                  onClick={() => triggerFileInput(false)}
                  className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Image className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Upload from Album
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};