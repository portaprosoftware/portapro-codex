import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoPreview: string | null;
  onSave: () => void;
  isUploading: boolean;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  isOpen,
  onClose,
  logoPreview,
  onSave,
  isUploading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Company Logo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Preview of your new company logo
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={onSave}
              disabled={isUploading || !logoPreview}
              className="bg-gradient-primary hover:bg-gradient-primary/90"
            >
              {isUploading ? "Saving..." : "Save Logo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};