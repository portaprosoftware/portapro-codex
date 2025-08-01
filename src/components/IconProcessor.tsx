import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';
import { toast } from 'sonner';

const ICON_URLS = [
  '/lovable-uploads/be0f247f-ec78-4858-9c8e-461602ed4dc5.png',
  '/lovable-uploads/cd5311a3-79e9-48f3-a689-7325482d6919.png'
];

export const IconProcessor: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [processedIcons, setProcessedIcons] = useState<{ [key: string]: string }>({});

  const processIcons = async () => {
    setProcessing(true);
    toast.info('Starting background removal for favicon icons...');

    try {
      const processed: { [key: string]: string } = {};

      for (const iconUrl of ICON_URLS) {
        console.log(`Processing icon: ${iconUrl}`);
        
        // Load the image
        const img = await loadImageFromUrl(iconUrl);
        
        // Remove background
        const transparentBlob = await removeBackground(img);
        
        // Create blob URL for preview
        const blobUrl = URL.createObjectURL(transparentBlob);
        processed[iconUrl] = blobUrl;
        
        console.log(`Successfully processed: ${iconUrl}`);
      }

      setProcessedIcons(processed);
      toast.success('Background removal complete! Check the preview below.');
      
    } catch (error) {
      console.error('Error processing icons:', error);
      toast.error('Failed to process icons. Check console for details.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadIcon = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Favicon Background Removal</CardTitle>
        <CardDescription>
          Process your PortaPro icons to remove backgrounds and create transparent versions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={processIcons} 
          disabled={processing}
          className="w-full"
        >
          {processing ? 'Processing Icons...' : 'Remove Backgrounds from Icons'}
        </Button>

        {Object.keys(processedIcons).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Processed Icons</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(processedIcons).map(([originalUrl, processedUrl], index) => (
                <div key={originalUrl} className="space-y-2">
                  <div className="text-sm font-medium">
                    Icon {index + 1} - Transparent
                  </div>
                  <div className="relative">
                    <img 
                      src={processedUrl} 
                      alt={`Processed icon ${index + 1}`}
                      className="w-32 h-32 object-contain border rounded"
                      style={{ 
                        background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => downloadIcon(processedUrl, `portapro-icon-${index + 1}-transparent.png`)}
                  >
                    Download PNG
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Next steps:</strong> Download these transparent icons and upload them to your project, 
                then update your favicon references in index.html and manifest.json to use the new transparent versions.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};