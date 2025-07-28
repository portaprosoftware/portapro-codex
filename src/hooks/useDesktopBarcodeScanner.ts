import { useEffect, useRef, useState } from 'react';

interface DesktopBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxLength?: number;
  scanTimeout?: number;
  enabled?: boolean;
}

export const useDesktopBarcodeScanner = ({
  onScan,
  minLength = 3,
  maxLength = 50,
  scanTimeout = 100,
  enabled = true
}: DesktopBarcodeScannerOptions) => {
  const [isScanning, setIsScanning] = useState(false);
  const scanBuffer = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastKeyTime = useRef(0);

  const processScan = () => {
    const barcode = scanBuffer.current.trim();
    
    if (barcode.length >= minLength && barcode.length <= maxLength) {
      setIsScanning(false);
      onScan(barcode);
    }
    
    scanBuffer.current = '';
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if (!enabled) return;

    const now = Date.now();
    const timeDiff = now - lastKeyTime.current;
    
    // Clear timeout if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If this is the first character or came quickly after the last one
    if (timeDiff < 50 || scanBuffer.current === '') {
      if (scanBuffer.current === '') {
        setIsScanning(true);
      }
      
      // Handle Enter key (common end character for barcode scanners)
      if (event.key === 'Enter' && scanBuffer.current.length > 0) {
        event.preventDefault();
        processScan();
        return;
      }
      
      // Add character to buffer (exclude control keys)
      if (event.key.length === 1) {
        scanBuffer.current += event.key;
        lastKeyTime.current = now;
        
        // Set timeout to process scan
        timeoutRef.current = setTimeout(() => {
          processScan();
        }, scanTimeout);
      }
    } else {
      // Too much time between keystrokes, reset buffer
      scanBuffer.current = '';
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keypress', handleKeyPress);
      
      return () => {
        document.removeEventListener('keypress', handleKeyPress);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [enabled, onScan, minLength, maxLength, scanTimeout]);

  const resetScanner = () => {
    scanBuffer.current = '';
    setIsScanning(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return {
    isScanning,
    resetScanner
  };
};