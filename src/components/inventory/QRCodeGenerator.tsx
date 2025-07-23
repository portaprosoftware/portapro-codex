
import React, { useState, useRef } from "react";
import { QrCode, Download, Printer, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  itemCode: string;
  itemId: string;
  onGenerate?: (qrData: string) => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  itemCode, 
  itemId, 
  onGenerate 
}) => {
  const [qrData, setQrData] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Generate QR data with item information
      const qrContent = JSON.stringify({
        type: "inventory_item",
        itemId,
        itemCode,
        timestamp: new Date().toISOString(),
        url: `${window.location.origin}/scan-feedback?item=${itemId}`
      });

      // For demo purposes, we'll create a simple QR-like pattern
      // In production, you'd use a proper QR code library like qrcode
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Create a simple pattern (placeholder for actual QR code)
          canvas.width = 200;
          canvas.height = 200;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 200, 200);
          
          // Draw a simple grid pattern
          ctx.fillStyle = "#000000";
          for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
              if (Math.random() > 0.5) {
                ctx.fillRect(i * 10, j * 10, 10, 10);
              }
            }
          }
          
          // Draw position markers
          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, 30, 30);
          ctx.fillRect(170, 0, 30, 30);
          ctx.fillRect(0, 170, 30, 30);
          
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(10, 10, 10, 10);
          ctx.fillRect(180, 10, 10, 10);
          ctx.fillRect(10, 180, 10, 10);
        }
      }

      setQrData(qrContent);
      onGenerate?.(qrContent);
      
      toast({
        title: "QR Code Generated",
        description: `QR code created for ${itemCode}`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `qr-${itemCode}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const copyQRData = async () => {
    if (qrData) {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "QR data copied to clipboard",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          QR Code Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="item-code">Item Code</Label>
          <Input
            id="item-code"
            value={itemCode}
            readOnly
            className="bg-gray-50"
          />
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-gray-200 rounded-lg max-w-full h-auto"
            style={{ display: qrData ? "block" : "none" }}
          />
          {!qrData && (
            <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <QrCode className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Click Generate to create QR code</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={generateQRCode}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate QR Code"}
          </Button>
          
          {qrData && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyQRData}
                className="flex-1"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy Data"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
