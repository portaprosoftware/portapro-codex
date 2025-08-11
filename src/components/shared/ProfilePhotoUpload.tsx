import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import { useProfilePhotoUpload } from '@/hooks/useProfilePhotoUpload';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  userId: string;
  userInitials: string;
  onPhotoUpdate: (photoUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  userId,
  userInitials,
  onPhotoUpdate,
  size = 'md'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const uploadMutation = useProfilePhotoUpload();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const photoUrl = await uploadMutation.mutateAsync({ file, userId });
      onPhotoUpdate(photoUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    onPhotoUpdate(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={triggerFileInput}
      >
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentPhotoUrl || undefined} alt="Profile photo" />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        
        {/* Overlay with upload icon */}
        <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity ${
          isHovered || uploadMutation.isPending ? 'opacity-100' : 'opacity-0'
        }`}>
          {uploadMutation.isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Camera className="h-4 w-4 text-white" />
          )}
        </div>
      </div>

      {/* Remove photo button when there's a photo */}
      {currentPhotoUrl && !uploadMutation.isPending && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
          onClick={handleRemovePhoto}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={uploadMutation.isPending}
      />
    </div>
  );
};