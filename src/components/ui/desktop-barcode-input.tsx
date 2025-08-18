import React, { forwardRef } from 'react';
import { Input } from './input';
import { Button } from './button';
import { ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    showCameraButton = false, 
    scannerEnabled = true,
    showTestButton = false,
    className,
    ...props 
  }, ref) => {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              {...props}
              ref={ref}
              className={cn("transition-all duration-200", className)}
            />
          </div>
          {onCameraScan && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onCameraScan}
              className="shrink-0"
              title="Scan barcode with camera"
            >
              <ScanLine className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {scannerEnabled && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              Bluetooth and wired barcode scanners can be utilized here.
            </span>
          </div>
        )}
      </div>
    );
  }
);

DesktopBarcodeInput.displayName = "DesktopBarcodeInput";