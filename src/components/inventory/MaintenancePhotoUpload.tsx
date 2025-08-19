import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X, Plus, Trash2, Edit, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Photo {
  id: string;
  photo_url: string;
  caption?: string;
  display_order: number;
  created_at: string;
}

interface MaintenancePhotoUploadProps {
  itemId: string;
}

export const MaintenancePhotoUpload: React.FC<MaintenancePhotoUploadProps> = ({
  itemId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editCaption, setEditCaption] = useState('');

  // Fetch existing maintenance photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['maintenance-photos', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_item_photos')
        .select('*')
        .eq('product_item_id', itemId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Photo[];
    },
    enabled: !!itemId,
  });

  // Upload photos mutation
  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ files, captions: photoCaptions }: { files: File[], captions: string[] }) => {
      const uploadPromises = files.map(async (file, index) => {
        // Compress and upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `maintenance-${itemId}-${Date.now()}-${index}.${fileExt}`;
        const filePath = `unit-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('unit-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('unit-photos')
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase
          .from('product_item_photos')
          .insert({
            product_item_id: itemId,
            photo_url: publicUrl,
            caption: photoCaptions[index] || null,
            display_order: (photos.length || 0) + index,
          });

        if (dbError) throw dbError;

        return publicUrl;
      });

      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      toast({
        title: "Photos Uploaded",
        description: "Maintenance photos have been saved successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['maintenance-photos', itemId] });
      setSelectedFiles([]);
      setPreviews([]);
      setCaptions([]);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photo: Photo) => {
      // Delete from database
      const { error: dbError } = await supabase
        .from('product_item_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      // Delete from storage
      const fileName = photo.photo_url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('unit-photos')
          .remove([`unit-photos/${fileName}`]);
        
        if (storageError) console.warn('Storage deletion failed:', storageError);
      }
    },
    onSuccess: () => {
      toast({
        title: "Photo Deleted",
        description: "Photo has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['maintenance-photos', itemId] });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update caption mutation
  const updateCaptionMutation = useMutation({
    mutationFn: async ({ photoId, caption }: { photoId: string, caption: string }) => {
      const { error } = await supabase
        .from('product_item_photos')
        .update({ caption })
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Caption Updated",
        description: "Photo caption has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['maintenance-photos', itemId] });
      setEditingPhoto(null);
      setEditCaption('');
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update caption. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const currentCount = photos.length + selectedFiles.length;
    const availableSlots = 5 - currentCount;
    
    if (files.length > availableSlots) {
      toast({
        title: "Too Many Photos",
        description: `You can only add ${availableSlots} more photos (maximum 5 total)`,
        variant: "destructive",
      });
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Create previews
    const newPreviews = [...previews];
    const newCaptions = [...captions];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        newCaptions.push('');
        setPreviews([...newPreviews]);
        setCaptions([...newCaptions]);
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

  const handleUpload = () => {
    if (selectedFiles.length === 0) return;
    uploadPhotosMutation.mutate({ files: selectedFiles, captions });
  };

  const removePreview = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    const newCaptions = captions.filter((_, i) => i !== index);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    setCaptions(newCaptions);
  };

  const updatePreviewCaption = (index: number, caption: string) => {
    const newCaptions = [...captions];
    newCaptions[index] = caption;
    setCaptions(newCaptions);
  };

  const startEditCaption = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditCaption(photo.caption || '');
  };

  const saveCaption = () => {
    if (!editingPhoto) return;
    updateCaptionMutation.mutate({ photoId: editingPhoto.id, caption: editCaption });
  };

  const canAddMore = photos.length + selectedFiles.length < 5;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Image className="w-4 h-4" />
        <h4 className="font-medium">Maintenance Photos ({photos.length}/5)</h4>
      </div>

      {/* Existing Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.photo_url}
                alt={photo.caption || 'Maintenance photo'}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => startEditCaption(photo)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deletePhotoMutation.mutate(photo)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              {photo.caption && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Photos Section */}
      {canAddMore && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={handleCameraCapture}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
            <Button
              onClick={() => document.getElementById(`maintenance-upload-${itemId}`)?.click()}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={`maintenance-upload-${itemId}`}
          />

          {/* Preview Selected Photos */}
          {previews.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {previews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 h-5 w-5 p-0"
                      onClick={() => removePreview(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <div className="mt-1">
                      <Input
                        placeholder="Caption"
                        value={captions[index]}
                        onChange={(e) => updatePreviewCaption(index, e.target.value)}
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={uploadPhotosMutation.isPending}
                size="sm"
                className="w-full"
              >
                {uploadPhotosMutation.isPending ? 'Uploading...' : `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </div>
      )}

      {!canAddMore && photos.length >= 5 && (
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">Maximum of 5 photos reached</p>
        </div>
      )}

      {/* Edit Caption Modal */}
      {editingPhoto && (
        <Dialog open={!!editingPhoto} onOpenChange={() => setEditingPhoto(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Photo Caption</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <img
                src={editingPhoto.photo_url}
                alt="Photo to edit"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Textarea
                placeholder="Enter photo caption..."
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={saveCaption} disabled={updateCaptionMutation.isPending}>
                  {updateCaptionMutation.isPending ? 'Saving...' : 'Save Caption'}
                </Button>
                <Button variant="outline" onClick={() => setEditingPhoto(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
