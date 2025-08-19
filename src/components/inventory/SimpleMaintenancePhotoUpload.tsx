import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpdatePhoto {
  file: File;
  preview: string;
  caption: string;
}

interface ExistingPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
  created_at: string;
}

interface SimpleMaintenancePhotoUploadProps {
  itemId: string;
  photos: UpdatePhoto[];
  onPhotosChange: (photos: UpdatePhoto[]) => void;
  maxPhotos?: number;
  onPhotoClick?: (photos: any[], index: number) => void;
}

export const SimpleMaintenancePhotoUpload: React.FC<SimpleMaintenancePhotoUploadProps> = ({
  itemId,
  photos,
  onPhotosChange,
  maxPhotos = 5,
  onPhotoClick
}) => {
  const { toast } = useToast();

  // Fetch existing saved photos (read-only display)
  const { data: existingPhotos = [] } = useQuery({
    queryKey: ['maintenance-photos', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_item_photos')
        .select('*')
        .eq('product_item_id', itemId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as ExistingPhoto[];
    },
    enabled: !!itemId,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const totalPhotos = existingPhotos.length + photos.length;
    const availableSlots = maxPhotos - totalPhotos;
    
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

  const totalPhotos = existingPhotos.length + photos.length;
  const canAddMore = totalPhotos < maxPhotos;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4" />
        <h4 className="font-medium">Initial Repair Photos ({totalPhotos}/{maxPhotos})</h4>
      </div>
      <p className="text-sm text-muted-foreground">Add up to 5 images of the initial damage.</p>

      {/* Existing Saved Photos (Read-only) */}
      {existingPhotos.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Saved Photos:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {existingPhotos.map((photo, index) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Maintenance photo'}
                  className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    // Convert photo_url to url format for ImageViewerModal
                    const formattedPhotos = existingPhotos.map(p => ({
                      url: p.photo_url,
                      caption: p.caption,
                      type: 'photo'
                    }));
                    onPhotoClick?.(formattedPhotos, index);
                  }}
                />
                {photo.caption && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Photos to Upload */}
      {photos.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">New Photos (will be saved when form is submitted):</p>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo, index) => {
              // Format all photos for ImageViewerModal
              const formattedExistingPhotos = existingPhotos.map(p => ({
                url: p.photo_url,
                caption: p.caption,
                type: 'photo'
              }));
              const formattedNewPhotos = photos.map(p => ({
                url: p.preview,
                caption: p.caption,
                type: 'photo'
              }));
              const allFormattedPhotos = [...formattedExistingPhotos, ...formattedNewPhotos];
              const photoIndex = existingPhotos.length + index;
              
              return (
                <div key={index} className="relative">
                  <img
                    src={photo.preview}
                    alt={`New photo ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onPhotoClick?.(allFormattedPhotos, photoIndex)}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                    type="button"
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
              );
            })}
          </div>
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
            onClick={() => document.getElementById(`maintenance-photo-upload-${itemId}`)?.click()}
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
        id={`maintenance-photo-upload-${itemId}`}
      />

      {!canAddMore && (
        <div className="text-center p-2 bg-muted/50 rounded text-sm text-muted-foreground">
          Maximum {maxPhotos} photos reached
        </div>
      )}
    </div>
  );
};
