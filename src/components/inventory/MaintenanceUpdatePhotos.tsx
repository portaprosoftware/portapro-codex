import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UpdatePhoto {
  file: File;
  preview: string;
  caption: string;
}

interface MaintenanceUpdatePhotosProps {
  photos: UpdatePhoto[];
  onPhotosChange: (photos: UpdatePhoto[]) => void;
  maxPhotos?: number;
}

export const MaintenanceUpdatePhotos: React.FC<MaintenanceUpdatePhotosProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 2
}) => {
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const availableSlots = maxPhotos - photos.length;
    
    if (files.length > availableSlots) {
      toast({
        title: "Too Many Photos",
        description: `You can only add ${availableSlots} more photos (maximum ${maxPhotos} total)`,
        variant: "destructive",
      });
      return;
    }

    const newPhotos: UpdatePhoto[] = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto: UpdatePhoto = {
          file,
          preview: e.target?.result as string,
          caption: ''
        };
        newPhotos.push(newPhoto);
        
        if (newPhotos.length === files.length) {
          onPhotosChange([...photos, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleFileSelect({ target } as any);
      }
    };
    input.click();
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const updateCaption = (index: number, caption: string) => {
    const newPhotos = [...photos];
    newPhotos[index].caption = caption;
    onPhotosChange(newPhotos);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4" />
        <span className="text-sm font-medium">Update Photos ({photos.length}/{maxPhotos})</span>
      </div>

      {/* Existing Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={photo.preview}
                alt={`Update photo ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg border"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 h-5 w-5 p-0"
                onClick={() => removePhoto(index)}
              >
                <X className="w-3 h-3" />
              </Button>
              <div className="mt-1">
                <Input
                  placeholder="Caption (optional)"
                  value={photo.caption}
                  onChange={(e) => updateCaption(index, e.target.value)}
                  className="text-xs h-7"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Photos */}
      {canAddMore && (
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleCameraCapture}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            Camera
          </Button>
          <Button
            type="button"
            onClick={() => document.getElementById('update-photo-upload')?.click()}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      )}

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="update-photo-upload"
      />

      {!canAddMore && (
        <div className="text-center p-2 bg-muted/50 rounded text-xs text-muted-foreground">
          Maximum {maxPhotos} photos per update
        </div>
      )}
    </div>
  );
};
