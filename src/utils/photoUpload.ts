import { supabase } from '@/integrations/supabase/client';

export interface PhotoUploadOptions {
  workOrderId: string;
  photoType: 'before' | 'after' | 'progress' | 'issue';
  caption?: string;
  uploadedBy?: string;
}

export interface PhotoUploadResult {
  success: boolean;
  photoId?: string;
  url?: string;
  error?: string;
}

/**
 * Convert data URL to Blob
 */
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload photo to Supabase Storage and save metadata
 */
export async function uploadWorkOrderPhoto(
  photoDataUrl: string,
  options: PhotoUploadOptions
): Promise<PhotoUploadResult> {
  try {
    const { workOrderId, photoType, caption, uploadedBy } = options;

    // Convert data URL to blob
    const blob = dataURLtoBlob(photoDataUrl);
    const fileSize = blob.size;
    const mimeType = blob.type;

    // Generate unique file name
    const timestamp = Date.now();
    const fileName = `${workOrderId}-${photoType}-${timestamp}.jpg`;
    const filePath = `work-orders/${workOrderId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('work-order-photos')
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('work-order-photos')
      .getPublicUrl(filePath);

    // Save metadata to database
    const { data: photoData, error: dbError } = await supabase
      .from('work_order_photos')
      .insert({
        work_order_id: workOrderId,
        storage_path: filePath,
        photo_type: photoType,
        caption,
        uploaded_by: uploadedBy,
        file_size: fileSize,
        mime_type: mimeType
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage
        .from('work-order-photos')
        .remove([filePath]);
      
      return {
        success: false,
        error: dbError.message
      };
    }

    return {
      success: true,
      photoId: photoData.id,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete photo from storage and database
 */
export async function deleteWorkOrderPhoto(photoId: string): Promise<boolean> {
  try {
    // Get photo metadata
    const { data: photo, error: fetchError } = await supabase
      .from('work_order_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      console.error('Failed to fetch photo:', fetchError);
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('work-order-photos')
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Failed to delete from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('work_order_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('Failed to delete from database:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during deletion:', error);
    return false;
  }
}

/**
 * Fetch all photos for a work order
 */
export async function fetchWorkOrderPhotos(workOrderId: string) {
  try {
    const { data, error } = await supabase
      .from('work_order_photos')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch photos:', error);
      return [];
    }

    // Get public URLs for each photo
    const photosWithUrls = data.map(photo => {
      const { data: urlData } = supabase.storage
        .from('work-order-photos')
        .getPublicUrl(photo.storage_path);

      return {
        id: photo.id,
        url: urlData.publicUrl,
        type: photo.photo_type as 'before' | 'after' | 'progress' | 'issue',
        caption: photo.caption,
        uploadedAt: photo.uploaded_at,
        fileSize: photo.file_size
      };
    });

    return photosWithUrls;
  } catch (error) {
    console.error('Unexpected error fetching photos:', error);
    return [];
  }
}
