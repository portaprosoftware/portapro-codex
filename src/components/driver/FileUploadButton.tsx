import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileUploadButtonProps {
  onFileUploaded: (fileUrl: string) => void;
  uploadedFile?: string | null;
  onFileRemoved: () => void;
  disabled?: boolean;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileUploaded,
  uploadedFile,
  onFileRemoved,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, image (JPG/PNG), or document file (DOC/DOCX).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `time-off-requests/${timestamp}_${sanitizedName}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(fileName);

      onFileUploaded(publicUrl);
      
      toast({
        title: "File Uploaded",
        description: "Your document has been uploaded successfully.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileName = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    // Remove timestamp prefix and sanitization
    return fileName.replace(/^\d+_/, '').replace(/_/g, ' ');
  };

  if (uploadedFile) {
    return (
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground truncate">
            {getFileName(uploadedFile)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFileRemoved}
          disabled={disabled}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </div>
  );
};