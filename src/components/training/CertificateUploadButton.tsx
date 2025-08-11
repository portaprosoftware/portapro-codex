
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CertificateUploadButtonProps {
  driverId?: string | null;
  certificationName?: string | null;
  onUploaded: (fileUrl: string, path: string) => void;
  uploadedFile?: string | null;
  onRemove?: () => void;
  disabled?: boolean;
  buttonText?: string;
}

export const CertificateUploadButton: React.FC<CertificateUploadButtonProps> = ({
  driverId,
  certificationName,
  onUploaded,
  uploadedFile,
  onRemove,
  disabled = false,
  buttonText = 'Upload Certificate',
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF, image (JPG/PNG), or document file (DOC/DOCX).',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const ts = Date.now();
      const clean = (s?: string | null) => (s || 'unknown').toString().replace(/[^a-zA-Z0-9.-]/g, '_');
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const folder = `certs/${clean(driverId)}`;
      const typePart = clean(certificationName);
      const path = `${folder}/${ts}_${typePart}_${sanitizedName}`;

      const { error } = await supabase.storage
        .from('training-certificates')
        .upload(path, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('training-certificates')
        .getPublicUrl(path);

      onUploaded(publicUrl, path);

      toast({
        title: 'Certificate Uploaded',
        description: 'Your certificate has been uploaded successfully.',
      });
    } catch (err) {
      console.error('Certificate upload error:', err);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload certificate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileName = (url: string) => {
    if (!url) return '';
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
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
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
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
        {uploading ? 'Uploading...' : buttonText}
      </Button>
    </div>
  );
};
