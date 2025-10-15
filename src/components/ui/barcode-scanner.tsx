import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (result: string) => void;
}

// NOTE: Native/mobile barcode scanning has been removed.
// This modal now supports Bluetooth/USB scanners (keyboard wedge) and manual entry only.
export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
}) => {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setCode('');
    }
  }, [isOpen]);

  const submit = () => {
    const value = code.trim();
    if (!value) return;
    onScanResult(value);
    setCode('');
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter or Scan Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-background p-4">
            <p className="text-sm mb-2">
              Use a Bluetooth/USB barcode scanner or type the code manually.
            </p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>Most scanners act like a keyboard and will type into the focused field.</li>
              <li>You can also paste a value or type it below, then press Enter.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={code}
              placeholder="Enter barcode / QR content"
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKey}
            />
            <Button onClick={submit}>Submit</Button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary">Camera access not required</Badge>
            <span className="text-muted-foreground">Mobile scanning removed</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};