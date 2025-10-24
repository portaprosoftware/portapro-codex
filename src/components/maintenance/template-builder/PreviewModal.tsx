import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { EnhancedTemplate } from './types';
import { PreviewPanel } from './preview/PreviewPanel';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Partial<EnhancedTemplate>;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle>Live Preview</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Preview Content - unchanged from original */}
        <div className="flex-1 overflow-auto p-6">
          <PreviewPanel template={template} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

