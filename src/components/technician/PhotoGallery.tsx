import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Trash2, Camera, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Photo {
  id: string;
  url: string;
  type: 'before' | 'after' | 'progress' | 'issue';
  caption?: string;
  uploadedAt: string;
  fileSize?: number;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
  onAddPhoto?: () => void;
  readOnly?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
  photos, 
  onDelete,
  onAddPhoto,
  readOnly = false
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const getPhotoTypeBadge = (type: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      before: { color: 'bg-blue-500', label: 'Before' },
      after: { color: 'bg-green-500', label: 'After' },
      progress: { color: 'bg-orange-500', label: 'Progress' },
      issue: { color: 'bg-red-500', label: 'Issue' }
    };
    
    const variant = variants[type] || variants.progress;
    
    return (
      <Badge className={`${variant.color} text-white`}>
        {variant.label}
      </Badge>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
  };

  if (photos.length === 0 && !onAddPhoto) {
    return (
      <Card className="p-8 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No photos yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <Card 
            key={photo.id}
            className="relative overflow-hidden cursor-pointer group"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="aspect-square relative">
              <img
                src={photo.url}
                alt={`${photo.type} photo`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Type Badge */}
              <div className="absolute top-2 left-2">
                {getPhotoTypeBadge(photo.type)}
              </div>

              {/* Delete Button */}
              {!readOnly && onDelete && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(photo.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}

        {/* Add Photo Button */}
        {!readOnly && onAddPhoto && (
          <Card
            className="aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border-dashed border-2"
            onClick={onAddPhoto}
          >
            <Camera className="h-10 w-10 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground font-medium">
              Add Photo
            </span>
          </Card>
        )}
      </div>

      {/* Fullscreen Photo Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
          {selectedPhoto && (
            <div className="relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Photo */}
              <img
                src={selectedPhoto.url}
                alt={`${selectedPhoto.type} photo`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {/* Photo Info */}
              <div className="p-4 bg-background">
                <div className="flex items-center justify-between mb-2">
                  {getPhotoTypeBadge(selectedPhoto.type)}
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedPhoto.uploadedAt), 'MMM d, yyyy • h:mm a')}
                  </span>
                </div>
                
                {selectedPhoto.caption && (
                  <p className="text-sm text-foreground mt-2">
                    {selectedPhoto.caption}
                  </p>
                )}

                {selectedPhoto.fileSize && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(selectedPhoto.fileSize)}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
