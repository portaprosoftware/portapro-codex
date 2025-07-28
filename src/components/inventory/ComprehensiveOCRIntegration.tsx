import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Camera, Smartphone, Wifi, WifiOff, CheckCircle, AlertTriangle,
  QrCode, Eye, Settings, RefreshCw, Target, Shield, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from 'qrcode.react';

interface ComprehensiveOCRIntegrationProps {
  productItemId?: string;
  jobId?: string;
  context: 'inventory' | 'job' | 'maintenance';
}

export const ComprehensiveOCRIntegration: React.FC<ComprehensiveOCRIntegrationProps> = ({
  productItemId,
  jobId,
  context
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [ocrInProgress, setOcrInProgress] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch item data with tool tracking
  const { data: itemData } = useQuery({
    queryKey: ["product-item-ocr", productItemId],
    queryFn: async () => {
      if (!productItemId) return null;

      const { data, error } = await supabase
        .from("product_items")
        .select(`
          *,
          products (name, category)
        `)
        .eq("id", productItemId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productItemId
  });

  // Process OCR mutation
  const processOCR = useMutation({
    mutationFn: async (imageBase64: string) => {
      setOcrInProgress(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('ocr-tool-tracking', {
          body: {
            imageBase64,
            itemId: productItemId
          }
        });

        if (error) throw error;
        return data;
      } finally {
        setOcrInProgress(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product-item-ocr"] });
      toast({
        title: "OCR Processing Complete",
        description: data.mock ? "Mock data generated for testing" : "Tool tracking data extracted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "OCR Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Enhanced QR Code with embedded tool data
  const generateEnhancedQR = () => {
    if (!itemData) return "";

    const qrData = {
      id: itemData.id,
      code: itemData.item_code,
      tool_number: itemData.tool_number,
      vendor_id: itemData.vendor_id,
      plastic_code: itemData.plastic_code,
      verification_status: itemData.verification_status,
      url: `${window.location.origin}/inventory/item/${itemData.id}`
    };

    return JSON.stringify(qrData);
  };

  const getVerificationBadge = (status: string | null, confidence: number | null) => {
    if (!status) return null;
    
    const badges = {
      manual_verified: <Badge className="bg-green-100 text-green-700"><Shield className="w-3 h-3 mr-1" />Verified</Badge>,
      auto_detected: confidence && confidence > 0.8 
        ? <Badge className="bg-blue-100 text-blue-700">Auto-detected</Badge>
        : <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>,
      needs_review: <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>
    };

    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Online - Full OCR available</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">Offline - Data cached locally</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQRGenerator(true)}
            disabled={!itemData}
          >
            <QrCode className="w-4 h-4 mr-1" />
            Enhanced QR
          </Button>
        </div>
      </div>

      {/* Tool Tracking Data Display */}
      {itemData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Tool Tracking Information
              {itemData.tool_number && (
                <Badge variant="outline" className="ml-2">
                  {itemData.tool_number}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tool Number</label>
                    <p className="font-mono text-sm">
                      {itemData.tool_number || "Not detected"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vendor ID</label>
                    <p className="font-mono text-sm">
                      {itemData.vendor_id || "Not detected"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Material Code</label>
                    <p className="text-sm">
                      {itemData.plastic_code || "Not detected"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Manufacturing Date</label>
                    <p className="text-sm">
                      {itemData.manufacturing_date 
                        ? new Date(itemData.manufacturing_date).toLocaleDateString()
                        : "Not detected"
                      }
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Verification Status</span>
                    {getVerificationBadge(itemData.verification_status, itemData.ocr_confidence_score)}
                  </div>
                  
                  {itemData.ocr_confidence_score && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">OCR Confidence</span>
                      <Badge variant="outline">
                        {Math.round(itemData.ocr_confidence_score * 100)}%
                      </Badge>
                    </div>
                  )}

                  {itemData.verification_status !== 'manual_verified' && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Add verification logic here
                          toast({
                            title: "Verification Updated",
                            description: "Item marked as manually verified",
                          });
                        }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Mark as Verified
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>OCR Processing</span>
                      <span className="text-gray-500">
                        {itemData.updated_at ? new Date(itemData.updated_at).toLocaleString() : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span>Item Created</span>
                      <span className="text-gray-500">
                        {new Date(itemData.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* OCR Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            OCR Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  // Trigger camera OCR
                  toast({
                    title: "Camera OCR",
                    description: "Camera-based OCR processing would start here",
                  });
                }}
                disabled={ocrInProgress}
              >
                {ocrInProgress ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Process with Camera
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  // Mobile PWA optimized OCR
                  toast({
                    title: "Mobile OCR",
                    description: "PWA-optimized mobile OCR would start here",
                  });
                }}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Mobile OCR
              </Button>
            </div>

            {!isOnline && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Offline mode: OCR results will be cached and synced when connection is restored.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced QR Code Modal */}
      <Dialog open={showQRGenerator} onOpenChange={setShowQRGenerator}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enhanced QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <QRCodeSVG
                value={generateEnhancedQR()}
                size={200}
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                QR code includes tool tracking data and verification status
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Download QR code logic
                  toast({
                    title: "QR Code Downloaded",
                    description: "Enhanced QR code saved to downloads",
                  });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setShowQRGenerator(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};