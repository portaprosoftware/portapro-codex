import React, { useState } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScanLine, QrCode, Barcode, X, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: string) => void;
}

type ScanType = 'barcode' | 'qr';

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState<ScanType>('barcode');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkPermission = async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.granted) {
        setHasPermission(true);
        return true;
      } else {
        setHasPermission(false);
        toast({
          title: 'Camera Permission Required',
          description: 'Please enable camera permission in your device settings to scan codes.',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Permission check failed:', error);
      setHasPermission(false);
      toast({
        title: 'Permission Error',
        description: 'Failed to check camera permissions.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const startScan = async () => {
    // Check if running on web (fallback behavior)
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: 'Native Feature Required',
        description: 'Barcode scanning requires a mobile device. Please use the mobile app.',
        variant: 'destructive'
      });
      return;
    }

    const hasPermissions = await checkPermission();
    if (!hasPermissions) return;

    try {
      setIsScanning(true);
      
      // Hide the body background to show camera
      document.body.classList.add('scanner-active');
      
      const result = await BarcodeScanner.startScan({
        targetedFormats: scanType === 'qr' ? ['QR_CODE'] : ['CODE_128', 'CODE_39', 'CODE_93', 'CODABAR', 'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E']
      });

      if (result.hasContent) {
        onScanResult(result.content);
        toast({
          title: 'Scan Successful',
          description: `${scanType === 'qr' ? 'QR Code' : 'Barcode'} scanned successfully!`
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Scan failed:', error);
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to scan code. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
      stopScan();
    }
  };

  const stopScan = async () => {
    try {
      await BarcodeScanner.stopScan();
      document.body.classList.remove('scanner-active');
      setIsScanning(false);
    } catch (error) {
      console.error('Failed to stop scan:', error);
    }
  };

  const handleClose = () => {
    if (isScanning) {
      stopScan();
    }
    onClose();
  };

  // Web fallback UI
  if (!Capacitor.isNativePlatform()) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Scanning Options
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multiple Ways to Scan</h3>
              <p className="text-sm text-muted-foreground">
                Choose the best scanning method for your device
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📱</div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Mobile Camera</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Open this page on your mobile device to use camera scanning
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔌</div>
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">USB/Bluetooth Scanner</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      Connect a barcode scanner to your computer. When connected, the SKU field will detect scans automatically.
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      ✓ Most USB/Bluetooth scanners work out of the box
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-950/30 rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⌨️</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Manual Entry</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Type the barcode numbers manually into the SKU field
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button onClick={onClose} variant="outline" className="w-full">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            Scan Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Scan Type Selection */}
          <div>
            <p className="text-sm font-medium mb-2">Select scan type:</p>
            <div className="flex gap-2">
              <Button
                variant={scanType === 'barcode' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanType('barcode')}
                className="flex items-center gap-2"
              >
                <Barcode className="w-4 h-4" />
                Barcode
              </Button>
              <Button
                variant={scanType === 'qr' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanType('qr')}
                className="flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </Button>
            </div>
          </div>

          {/* Scanner Status */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              {scanType === 'qr' ? (
                <QrCode className="w-12 h-12 text-muted-foreground" />
              ) : (
                <Barcode className="w-12 h-12 text-muted-foreground" />
              )}
              
              {isScanning && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-primary animate-pulse" />
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">
                {isScanning ? 'Scanning...' : `Ready to scan ${scanType === 'qr' ? 'QR Code' : 'Barcode'}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {scanType === 'qr' 
                  ? 'Point camera at QR code' 
                  : 'Point camera at barcode'
                }
              </p>
            </div>

            {hasPermission === false && (
              <Badge variant="destructive">Camera permission required</Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScan} className="flex-1">
                <ScanLine className="w-4 h-4 mr-2" />
                Start Scanning
              </Button>
            ) : (
              <Button onClick={stopScan} variant="destructive" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Stop Scanning
              </Button>
            )}
            
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};