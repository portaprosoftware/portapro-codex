import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UnitPhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  onComplete?: (photoUrl: string) => void;
}

export const UnitPhotoCapture: React.FC<UnitPhotoCaptureProps> = ({
  open,
  onClose,
  itemId,
  onComplete
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `unit-${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `unit-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('unit-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('unit-photos')
        .getPublicUrl(filePath);

      // Update product item with photo URL
      const { error: updateError } = await supabase
        .from('product_items')
        .update({ tracking_photo_url: publicUrl })
        .eq('id', itemId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: (photoUrl) => {
      toast({
        title: "Photo Uploaded",
        description: "Unit photo has been saved successfully",
      });
      
      // Invalidate the query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["product-item", itemId] });
      
      if (onComplete) {
        onComplete(photoUrl);
      }
      
      handleClose();
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    onClose();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Take Unit Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden file inputs */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="upload-input"
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
                  onClick={() => {
                    setSelectedImage(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadMutation.isPending ? 'Uploading...' : 'Save Photo'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={triggerFileInput}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Retake
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center">
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Take photo of this unit
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={triggerFileInput}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </Button>
                  <Button 
                    onClick={() => document.getElementById('upload-input')?.click()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};