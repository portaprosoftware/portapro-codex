import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  File, 
  X, 
  Check, 
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  FileX
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentAccess } from '@/hooks/useRoleAccess';

interface DocumentUploadProps {
  driverId: string;
  documentType: 'license' | 'medical_card' | 'training' | 'other';
  existingUrl?: string;
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
  className?: string;
}

export function DocumentUpload({
  driverId,
  documentType,
  existingUrl,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10,
  acceptedFileTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  className
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  
  const documentAccess = useDocumentAccess(documentType, driverId);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      return `File type not supported. Please upload: ${acceptedFileTypes.map(type => 
        type.split('/')[1].toUpperCase()
      ).join(', ')}`;
    }

    // Additional security checks
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileName = file.name.toLowerCase();
    
    if (suspiciousExtensions.some(ext => fileName.endsWith(ext))) {
      return 'File type not allowed for security reasons';
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError?.(validationError);
      toast({
        title: "Upload Failed",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate secure filename
      const fileExt = file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `${driverId}/${documentType}/${timestamp}_${randomString}.${fileExt}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(fileName);

      // Log the upload activity
      await supabase
        .from('driver_activity_log')
        .insert({
          driver_id: driverId,
          action_type: 'document_upload',
          action_details: {
            document_type: documentType,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: fileName
          }
        });

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully.`,
      });

      onUploadComplete(publicUrl);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Upload failed. Please try again.';
      
      onUploadError?.(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: 1,
    disabled: uploading || !documentAccess.canUpload
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  if (!documentAccess.canUpload) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to upload documents for this driver.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={className}>
      {!uploading && (
        <Card className={`border-2 border-dashed transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className="cursor-pointer text-center"
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center space-y-4">
                <div className="p-3 bg-muted rounded-full">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive 
                      ? 'Drop the file here...' 
                      : 'Click to upload or drag and drop'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPEG, PNG or WebP (max {maxFileSize}MB)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Upload className="w-4 h-4 text-blue-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Uploading document...</p>
                  <p className="text-xs text-muted-foreground">
                    Please don't close this window
                  </p>
                </div>
              </div>
              
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                {uploadProgress}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {existingUrl && !uploading && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Document uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    Click to view or download
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(existingUrl, '_blank')}
                >
                  View
                </Button>
                
                {documentAccess.canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement delete functionality
                      toast({
                        title: "Delete Document",
                        description: "Delete functionality will be implemented in the next phase.",
                      });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}