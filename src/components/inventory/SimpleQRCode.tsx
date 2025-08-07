import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface SimpleQRCodeProps {
  itemCode: string;
  qrCodeData?: string | null;
  showAsButton?: boolean;
}

export const SimpleQRCode: React.FC<SimpleQRCodeProps> = ({ 
  itemCode, 
  qrCodeData, 
  showAsButton = false 
}) => {
  const [showViewer, setShowViewer] = React.useState(false);
  
  // Use item code as QR data if no specific data is provided
  const qrData = qrCodeData || itemCode;

  const downloadQR = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      toast.error('Canvas not supported');
      return;
    }

    // Set canvas size with extra height for text
    const qrSize = 200;
    const textHeight = 40;
    const padding = 20;
    const totalHeight = qrSize + textHeight + (padding * 2);
    const totalWidth = qrSize + (padding * 2);
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    
    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    // Create SVG for QR code
    const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('width', qrSize.toString());
    svgElement.setAttribute('height', qrSize.toString());
    svgElement.innerHTML = `
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${document.querySelector('#qr-code-svg')?.outerHTML || ''}
        </div>
      </foreignObject>
    `;
    
    // Convert QR code SVG to image
    const qrSvg = document.querySelector('#qr-code-svg') as unknown as SVGElement;
    if (!qrSvg) {
      toast.error('QR code not found');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(qrSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      // Draw QR code
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      
      // Draw item code text below QR code
      ctx.fillStyle = 'black';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textX = totalWidth / 2;
      const textY = qrSize + padding + (textHeight / 2);
      ctx.fillText(itemCode, textX, textY);
      
      // Download the canvas as PNG
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `qr-${itemCode}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('QR code downloaded successfully');
        }
      });
      
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  };

  if (showAsButton) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowViewer(true)}
          className="p-1"
          title={`View QR code for ${itemCode}`}
        >
          <Eye className="w-4 h-4" />
        </Button>

        <Dialog open={showViewer} onOpenChange={setShowViewer}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code - {itemCode}</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrData}
                  size={200}
                  level="M"
                  includeMargin
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Item Code: {itemCode}</p>
                <p className="text-xs text-gray-500">QR Data: {qrData}</p>
              </div>

              <Button 
                onClick={downloadQR}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="p-4 bg-white rounded-lg">
        <QRCodeSVG
          id="qr-code-svg"
          value={qrData}
          size={200}
          level="M"
          includeMargin
        />
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Item Code: {itemCode}</p>
        <p className="text-xs text-gray-500">QR Data: {qrData}</p>
      </div>

      <Button 
        onClick={downloadQR}
        variant="outline"
      >
        <Download className="w-4 h-4 mr-2" />
        Download QR Code
      </Button>
    </div>
  );
};