import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share, Copy, QrCode, Camera, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedQRCodeGeneratorProps {
  open: boolean;
  onClose: () => void;
  itemId?: string;
  itemCode?: string;
}

export const EnhancedQRCodeGenerator: React.FC<EnhancedQRCodeGeneratorProps> = ({
  open,
  onClose,
  itemId,
  itemCode
}) => {
  const { toast } = useToast();
  const [qrData, setQrData] = useState<string>("");
  const [includeToolData, setIncludeToolData] = useState(true);
  const [customUrl, setCustomUrl] = useState("");
  const [qrSize, setQrSize] = useState(256);

  // Fetch item details with tool tracking data
  const { data: itemData } = useQuery({
    queryKey: ["item-detail", itemId],
    queryFn: async () => {
      if (!itemId) return null;

      const { data, error } = await supabase
        .from("product_items")
        .select(`
          *,
          products (name, description)
        `)
        .eq("id", itemId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!itemId && open
  });

  const generateQRData = (type: "basic" | "tool_tracking" | "service_request" | "custom") => {
    const baseUrl = window.location.origin;
    
    switch (type) {
      case "basic":
        return JSON.stringify({
          type: "inventory_item",
          itemId: itemId,
          itemCode: itemCode,
          url: `${baseUrl}/inventory/item/${itemId}`
        });

      case "tool_tracking":
        const toolData = {
          type: "tool_tracking",
          itemId: itemId,
          itemCode: itemCode,
          toolNumber: itemData?.tool_number,
          vendorId: itemData?.vendor_id,
          plasticCode: itemData?.plastic_code,
          verificationStatus: itemData?.verification_status,
          productName: itemData?.products?.name,
          url: `${baseUrl}/inventory/item/${itemId}/tracking`
        };
        return JSON.stringify(toolData);

      case "service_request":
        return JSON.stringify({
          type: "service_request",
          itemId: itemId,
          itemCode: itemCode,
          productName: itemData?.products?.name,
          url: `${baseUrl}/service/request?item=${itemId}`
        });

      case "custom":
        return customUrl || `${baseUrl}/inventory/item/${itemId}`;

      default:
        return "";
    }
  };

  const downloadQR = (format: "png" | "svg") => {
    const canvas = document.querySelector("#qr-code canvas") as HTMLCanvasElement;
    if (!canvas) return;

    if (format === "png") {
      const link = document.createElement("a");
      link.download = `qr-${itemCode || "code"}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } else {
      // SVG download would require different handling
      toast({
        title: "SVG Download",
        description: "SVG download feature coming soon",
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      toast({
        title: "Copied!",
        description: "QR code data copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Enhanced QR Code Generator
            {itemCode && <Badge variant="outline">{itemCode}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="tool-tracking" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="tool-tracking">Tool Tracking</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Basic Item QR Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Links to basic item information and inventory details
                </p>
                <Button
                  onClick={() => setQrData(generateQRData("basic"))}
                  className="w-full"
                >
                  Generate Basic QR Code
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="tool-tracking" className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Tool Tracking QR Code
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Embeds tool number, vendor ID, and tracking information
                </p>
                
                {itemData?.tool_number && (
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-white rounded border">
                    <div>
                      <span className="text-xs font-medium text-blue-700">Tool Number:</span>
                      <p className="font-mono text-sm">{itemData.tool_number}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-blue-700">Vendor ID:</span>
                      <p className="font-mono text-sm">{itemData.vendor_id || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-blue-700">Plastic Code:</span>
                      <p className="text-sm">{itemData.plastic_code || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-blue-700">Status:</span>
                      <Badge variant="outline" className="text-xs">
                        {itemData.verification_status || "unverified"}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={() => setQrData(generateQRData("tool_tracking"))}
                  className="w-full"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Generate Tool Tracking QR
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium mb-2">Service Request QR Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Links to service request form for this specific item
                </p>
                <Button
                  onClick={() => setQrData(generateQRData("service_request"))}
                  className="w-full"
                >
                  Generate Service QR Code
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-url">Custom URL</Label>
                  <Input
                    id="custom-url"
                    placeholder="https://your-custom-url.com"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => setQrData(generateQRData("custom"))}
                  disabled={!customUrl}
                  className="w-full"
                >
                  Generate Custom QR Code
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* QR Code Display */}
          {qrData && (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                <div id="qr-code">
                  <QRCodeSVG
                    value={qrData}
                    size={qrSize}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* QR Code Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label htmlFor="qr-size">Size:</Label>
                  <Input
                    id="qr-size"
                    type="number"
                    min="128"
                    max="512"
                    value={qrSize}
                    onChange={(e) => setQrSize(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Data
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadQR("png")}>
                    <Download className="w-4 h-4 mr-1" />
                    PNG
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>

              {/* QR Data Preview */}
              <div className="space-y-2">
                <Label>QR Code Data Preview:</Label>
                <Textarea
                  value={qrData}
                  readOnly
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};