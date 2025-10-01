import React, { useState } from 'react';
import { X, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PhotoCapture } from './PhotoCapture';

interface InspectionPhotoGalleryProps {
  photos: string[];
  isEditMode: boolean;
  onPhotosChange?: (photos: string[]) => void;
}

export function InspectionPhotoGallery({ photos, isEditMode, onPhotosChange }: InspectionPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange?.(newPhotos);
  };

  const handleAddPhotos = (newPhotos: string[]) => {
    onPhotosChange?.([...photos, ...newPhotos]);
    setShowPhotoCapture(false);
  };

  if (photos.length === 0 && !isEditMode) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No photos attached to this inspection
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group rounded-lg overflow-hidden border">
            <img
              src={photo}
              alt={`Inspection photo ${index + 1}`}
              className="w-full h-48 object-cover cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => setSelectedPhoto(photo)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setSelectedPhoto(photo)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {isEditMode && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemovePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isEditMode && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowPhotoCapture(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Photos
        </Button>
      )}

      {/* Lightbox for viewing photos */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Full size inspection photo"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Photo capture modal */}
      {showPhotoCapture && (
        <Dialog open={showPhotoCapture} onOpenChange={setShowPhotoCapture}>
          <DialogContent className="max-w-2xl">
            <PhotoCapture
              onPhotosChange={handleAddPhotos}
              maxPhotos={10}
              initialPhotos={[]}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
