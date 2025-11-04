import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MobileCamera } from '@/components/technician/MobileCamera';
import { PhotoGallery } from '@/components/technician/PhotoGallery';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadWorkOrderPhoto, deleteWorkOrderPhoto, fetchWorkOrderPhotos } from '@/utils/photoUpload';

export const TechnicianPhotoCapture: React.FC = () => {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'progress' | 'issue'>('progress');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch work order details
  const { data: workOrder, isLoading: isLoadingWO } = useQuery({
    queryKey: ['work-order', workOrderId],
    queryFn: async () => {
      if (!workOrderId) return null;
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', workOrderId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!workOrderId,
  });

  // Fetch photos
  const { data: photos, refetch: refetchPhotos, isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['work-order-photos', workOrderId],
    queryFn: async () => {
      if (!workOrderId) return [];
      return await fetchWorkOrderPhotos(workOrderId);
    },
    enabled: !!workOrderId,
  });

  const handleCapturePhoto = async (photoDataUrl: string) => {
    if (!workOrderId) return;

    setIsUploading(true);
    setIsCameraOpen(false);

    try {
      const result = await uploadWorkOrderPhoto(photoDataUrl, {
        workOrderId,
        photoType,
        uploadedBy: user?.id,
      });

      if (result.success) {
        toast({
          title: 'Photo uploaded! 📸',
          description: `${photoType.charAt(0).toUpperCase() + photoType.slice(1)} photo saved successfully`,
        });
        refetchPhotos();
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'Failed to upload photo',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const success = await deleteWorkOrderPhoto(photoId);
    
    if (success) {
      toast({
        title: 'Photo deleted',
        description: 'Photo removed successfully',
      });
      refetchPhotos();
    } else {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  const handleContinue = () => {
    navigate(`/technician/complete/${workOrderId}`);
  };

  if (isLoadingWO) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-foreground">
              {workOrder?.work_order_number || 'Work Order Photos'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Capture before/after photos
            </p>
          </div>
          <div className="w-11" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Photo Type Selector */}
        <Card className="p-4">
          <label className="text-sm font-medium text-foreground mb-3 block">
            Select Photo Type
          </label>
          <Tabs value={photoType} onValueChange={(value) => setPhotoType(value as any)}>
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="before" className="text-sm">Before</TabsTrigger>
              <TabsTrigger value="after" className="text-sm">After</TabsTrigger>
              <TabsTrigger value="progress" className="text-sm">Progress</TabsTrigger>
              <TabsTrigger value="issue" className="text-sm">Issue</TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {/* Capture Button */}
        <Button
          onClick={() => setIsCameraOpen(true)}
          disabled={isUploading}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="h-6 w-6 mr-2" />
              Take {photoType.charAt(0).toUpperCase() + photoType.slice(1)} Photo
            </>
          )}
        </Button>

        {/* Photo Gallery */}
        {isLoadingPhotos ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Captured Photos ({photos?.length || 0})
            </h2>
            <PhotoGallery
              photos={photos || []}
              onDelete={handleDeletePhoto}
            />
          </div>
        )}

        {/* Continue Button */}
        {(photos?.length || 0) > 0 && (
          <Button
            onClick={handleContinue}
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <CheckCircle2 className="h-6 w-6 mr-2" />
            Continue to Complete Work Order
          </Button>
        )}
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <MobileCamera
          onCapture={handleCapturePhoto}
          onClose={() => setIsCameraOpen(false)}
          photoType={photoType}
        />
      )}
    </div>
  );
};
