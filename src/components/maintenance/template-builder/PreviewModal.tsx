import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, RefreshCw } from 'lucide-react';
import { EnhancedTemplate } from './types';
import { PreviewPanel } from './preview/PreviewPanel';
import { toast } from 'sonner';

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
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  const handleRetry = () => {
    setHasError(false);
    setKey(prev => prev + 1);
    toast.info('Refreshing preview...');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0 z-[100]">
        {/* Header - 64px height */}
        <DialogHeader className="px-6 h-16 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <DialogTitle>Live Preview</DialogTitle>
          <div className="flex items-center gap-2">
            {hasError && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
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

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6">
          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">Failed to load preview</p>
              <Button onClick={handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : (
            <PreviewPanel key={key} template={template} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

