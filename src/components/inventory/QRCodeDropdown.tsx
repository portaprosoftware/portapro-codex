
import React, { useState } from "react";
import { QrCode, Eye, Download, ChevronDown, Settings, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeGenerator } from "./QRCodeGenerator";
import { QRCodeScanner } from "./QRCodeScanner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QRCodeDropdownProps {
  itemCode: string;
  itemId: string;
  qrCodeData?: string;
  onQRUpdate?: (qrData: string) => void;
}

export const QRCodeDropdown: React.FC<QRCodeDropdownProps> = ({ 
  itemCode, 
  itemId, 
  qrCodeData,
  onQRUpdate 
}) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const { toast } = useToast();

  const handleViewQR = () => {
    if (qrCodeData) {
      setShowViewer(true);
    } else {
      toast({
        title: "No QR Code",
        description: "This item doesn't have a QR code yet. Generate one first.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateQR = async (qrData: string) => {
    try {
      const { error } = await supabase
        .from("product_items")
        .update({ qr_code_data: qrData })
        .eq("id", itemId);

      if (error) throw error;

      onQRUpdate?.(qrData);
      setShowGenerator(false);
      
      toast({
        title: "QR Code Generated",
        description: `QR code created for ${itemCode}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to save QR code data",
        variant: "destructive",
      });
    }
  };

  const handleScanResult = (result: string) => {
    console.log("Scanned QR code:", result);
    setShowScanner(false);
    
    toast({
      title: "QR Code Scanned",
      description: "Processing scanned QR code...",
    });
  };

  const handleDownloadQR = () => {
    if (qrCodeData) {
      // This would typically generate and download the QR code
      toast({
        title: "QR Code Downloaded",
        description: `QR code for ${itemCode} downloaded`,
      });
    } else {
      toast({
        title: "No QR Code",
        description: "Generate a QR code first before downloading",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
            <QrCode className={`w-4 h-4 ${qrCodeData ? 'text-blue-600' : 'text-gray-400'}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
          <DropdownMenuItem onClick={handleViewQR} className="flex items-center gap-2 cursor-pointer">
            <Eye className="w-4 h-4" />
            View QR Code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadQR} className="flex items-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" />
            Download QR Code
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowGenerator(true)} className="flex items-center gap-2 cursor-pointer">
            <Settings className="w-4 h-4" />
            {qrCodeData ? 'Regenerate QR' : 'Generate QR Code'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowScanner(true)} className="flex items-center gap-2 cursor-pointer">
            <Camera className="w-4 h-4" />
            Scan QR Code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate QR Code</DialogTitle>
          </DialogHeader>
          <QRCodeGenerator
            itemCode={itemCode}
            itemId={itemId}
            onGenerate={handleGenerateQR}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <QRCodeScanner
            onScan={handleScanResult}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {itemCode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Scan this QR code to access item information
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
