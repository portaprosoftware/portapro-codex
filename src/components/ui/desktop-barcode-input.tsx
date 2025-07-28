import React, { forwardRef } from 'react';
import { Input } from './input';
import { Button } from './button';
import { ScanLine, Keyboard, TestTube2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDesktopBarcodeScanner } from '@/hooks/useDesktopBarcodeScanner';
import { useIsMobile } from '@/hooks/use-mobile';

interface DesktopBarcodeInputProps extends React.ComponentProps<typeof Input> {
  onScanResult: (barcode: string) => void;
  onCameraScan?: () => void;
  showCameraButton?: boolean;
  scannerEnabled?: boolean;
  showTestButton?: boolean;
}

export const DesktopBarcodeInput = forwardRef<HTMLInputElement, DesktopBarcodeInputProps>(
  ({ 
    onScanResult, 
    onCameraScan, 
    showCameraButton = true, 
    scannerEnabled = true,
    showTestButton = false,
    className,
    ...props 
  }, ref) => {
    const isMobile = useIsMobile();
    
    const { isScanning, scannerDetected, testScanner } = useDesktopBarcodeScanner({
      onScan: onScanResult,
      enabled: scannerEnabled && !isMobile,
      minLength: 3,
      maxLength: 50,
      scanTimeout: 100
    });

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              {...props}
              ref={ref}
              className={cn(
                "transition-all duration-200",
                isScanning && "ring-2 ring-primary ring-offset-1 border-primary",
                className
              )}
            />
            {isScanning && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            )}
          </div>
          
          {showCameraButton && onCameraScan && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCameraScan}
              className="px-3"
              title={isMobile ? "Scan with camera" : "Camera scanning (mobile only) or use USB/Bluetooth scanner"}
            >
              <ScanLine className="w-4 h-4" />
            </Button>
          )}

          {!isMobile && showTestButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={testScanner}
              className="px-3"
              title="Test your USB/Bluetooth scanner"
            >
              <TestTube2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {!isMobile && scannerEnabled && (
          <div className="flex items-center gap-2 text-xs">
            {isScanning ? (
              <>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <span className="text-primary font-medium">Scanning barcode...</span>
              </>
            ) : scannerDetected ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600">USB/Bluetooth scanner detected and ready</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  No barcode scanner detected - connect USB/Bluetooth scanner or 
                  {showTestButton && (
                    <button 
                      onClick={testScanner}
                      className="ml-1 underline hover:no-underline text-primary"
                    >
                      test scanner
                    </button>
                  )}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

DesktopBarcodeInput.displayName = "DesktopBarcodeInput";