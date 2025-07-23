import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "./useOfflineSync";

interface UploadPhotoData {
  jobId: string;
  driverId: string;
  file: File;
  category?: 'before' | 'after' | 'issue' | 'completion';
}

interface UploadSignatureData {
  jobId: string;
  driverId: string;
  signatureBlob: Blob;
  customerName?: string;
}

// Helper function to compress image
const compressImage = (file: File, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 1920px width)
      const maxWidth = 1920;
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export function useJobPhotoUpload() {
  const { toast } = useToast();
  const { addToQueue, isOnline } = useOfflineSync();

  return useMutation({
    mutationFn: async (data: UploadPhotoData) => {
      if (!isOnline) {
        addToQueue({
          type: 'photo',
          jobId: data.jobId,
          data: { 
            file: data.file,
            driverId: data.driverId,
            category: data.category || 'general'
          }
        });
        return null;
      }

      // Compress the image
      const compressedBlob = await compressImage(data.file);
      
      // Generate filename
      const timestamp = Date.now();
      const filename = `${data.jobId}/${data.driverId}/${data.category || 'general'}_${timestamp}.jpg`;

      const { error } = await supabase.storage
        .from('job-photos')
        .upload(filename, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('job-photos')
        .getPublicUrl(filename);

      return {
        filename,
        url: urlData.publicUrl,
        category: data.category
      };
    },
    onSuccess: (result) => {
      if (result) {
        toast({
          title: "Photo Uploaded",
          description: "Photo has been saved successfully",
        });
      } else {
        toast({
          title: "Queued for Upload",
          description: "Photo will upload when connection is restored",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo",
        variant: "destructive",
      });
      console.error('Photo upload error:', error);
    }
  });
}

export function useJobSignatureUpload() {
  const { toast } = useToast();
  const { addToQueue, isOnline } = useOfflineSync();

  return useMutation({
    mutationFn: async (data: UploadSignatureData) => {
      if (!isOnline) {
        addToQueue({
          type: 'signature',
          jobId: data.jobId,
          data: { 
            signatureBlob: data.signatureBlob,
            driverId: data.driverId,
            customerName: data.customerName
          }
        });
        return null;
      }

      // Generate filename
      const timestamp = Date.now();
      const filename = `${data.jobId}/${data.driverId}/signature_${timestamp}.png`;

      const { error } = await supabase.storage
        .from('job-signatures')
        .upload(filename, data.signatureBlob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('job-signatures')
        .getPublicUrl(filename);

      return {
        filename,
        url: urlData.publicUrl,
        customerName: data.customerName
      };
    },
    onSuccess: (result) => {
      if (result) {
        toast({
          title: "Signature Saved",
          description: "Customer signature has been recorded",
        });
      } else {
        toast({
          title: "Queued for Upload",
          description: "Signature will upload when connection is restored",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to save signature",
        variant: "destructive",
      });
      console.error('Signature upload error:', error);
    }
  });
}