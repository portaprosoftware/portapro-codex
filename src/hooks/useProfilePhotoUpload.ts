import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const compressImage = async (file: File, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const maxSize = 400; // Profile photos don't need to be huge
      let { width, height } = img;
      
      // Maintain aspect ratio while limiting size
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export interface UploadProfilePhotoData {
  file: File;
  userId: string;
}

export function useProfilePhotoUpload() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, userId }: UploadProfilePhotoData): Promise<string> => {
      // Compress the image
      const compressedFile = await compressImage(file);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, compressedFile, {
          upsert: true
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile photo uploaded successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Profile photo upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}