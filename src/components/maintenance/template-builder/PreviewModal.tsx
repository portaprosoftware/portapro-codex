import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, RefreshCw, Smartphone, Tablet, FileText } from 'lucide-react';
import { EnhancedTemplate } from './types';
import { PhonePreview } from './preview/PhonePreview';
import { TabletPreview } from './preview/TabletPreview';
import { PDFPreview } from './preview/PDFPreview';
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
  const [activeTab, setActiveTab] = useState('phone');

  const handleRetry = () => {
    setHasError(false);
    setKey(prev => prev + 1);
    toast.info('Refreshing preview...');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }} modal={true}>
      <DialogContent 
        className="max-w-[95vw] w-full h-[95vh] p-0 border-t-4 border-t-primary flex flex-col"
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement).hasAttribute('data-radix-dialog-overlay')) {
            onClose();
          } else {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogDescription className="sr-only">Template live rendering preview</DialogDescription>
        
        {/* Header */}
        <div className="pb-3 p-6 relative border-b">
          <div className="flex items-center gap-2 pr-10">
            <span className="text-2xl font-semibold">Live Preview</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({template.sections?.length || 0} sections)
            </span>
          </div>
          
          {/* Close button */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
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
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6 pt-0">
          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">Failed to load preview</p>
              <Button onClick={handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Phone</span>
                </TabsTrigger>
                <TabsTrigger value="tablet" className="flex items-center gap-2">
                  <Tablet className="w-4 h-4" />
                  <span>Tablet</span>
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="mt-0 flex-1">
                <PhonePreview key={key} template={template} />
              </TabsContent>

              <TabsContent value="tablet" className="mt-0 flex-1">
                <TabletPreview key={key} template={template} />
              </TabsContent>

              <TabsContent value="pdf" className="mt-0 flex-1">
                <PDFPreview key={key} template={template} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

