
import React, { useState, useRef, useEffect } from "react";
import { Camera, X, Scan, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "upload" | "manual">("camera");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: "Camera Access Failed",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsScanning(false);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Simulate QR code detection (in production, use a proper QR library)
        const mockQRData = JSON.stringify({
          type: "inventory_item",
          itemId: "mock-item-id",
          itemCode: "MOCK-001",
          timestamp: new Date().toISOString()
        });
        
        onScan(mockQRData);
        toast({
          title: "QR Code Detected",
          description: "Processing scanned code...",
        });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Simulate QR code detection from image
        const mockQRData = JSON.stringify({
          type: "inventory_item",
          itemId: "uploaded-item-id",
          itemCode: "UPLOAD-001",
          timestamp: new Date().toISOString()
        });
        
        onScan(mockQRData);
        toast({
          title: "QR Code Processed",
          description: "QR code detected from uploaded image",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      toast({
        title: "Manual Input Processed",
        description: "Processing manual QR data...",
      });
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Scan className="w-5 h-5" />
          QR Code Scanner
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
        <div className="flex gap-2">
          <Button
            variant={scanMode === "camera" ? "default" : "outline"}
            size="sm"
            onClick={() => setScanMode("camera")}
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            Camera
          </Button>
          <Button
            variant={scanMode === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => setScanMode("upload")}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant={scanMode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setScanMode("manual")}
            className="flex-1"
          >
            <Search className="w-4 h-4 mr-2" />
            Manual
          </Button>
        </div>

        {scanMode === "camera" && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-48 bg-black rounded-lg"
                style={{ display: isScanning ? "block" : "none" }}
              />
              {!isScanning && (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Click to start camera</p>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startCamera} className="flex-1">
                  Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={captureFrame} className="flex-1">
                    Capture & Scan
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Stop Camera
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {scanMode === "upload" && (
          <div className="space-y-4">
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400"
              >
                <div className="text-center text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Click to upload QR code image</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {scanMode === "manual" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-input">Enter QR Code Data</Label>
              <Input
                id="manual-input"
                placeholder="Paste QR code data or item code here..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleManualSubmit()}
              />
            </div>
            <Button onClick={handleManualSubmit} className="w-full">
              Process Manual Input
            </Button>
          </div>
        )}
    </div>
  );
};
