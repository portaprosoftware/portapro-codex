import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import qrGallery1 from '@/assets/qr-gallery-1.png';
import qrGallery2 from '@/assets/qr-gallery-2.png';

interface QRGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const galleryImages = [
  {
    src: qrGallery1,
    alt: 'QR Codes Print Selection Interface'
  },
  {
    src: qrGallery2,
    alt: 'QR Code Grid Print Layout'
  }
];

export const QRGalleryModal: React.FC<QRGalleryModalProps> = ({ isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-rotation timer with progress tracking
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }
    
    const duration = 4000; // 4 seconds
    const interval = 50; // Update every 50ms for smooth animation
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const newProgress = (elapsed / duration) * 100;
      
      if (newProgress >= 100) {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
        elapsed = 0;
        setProgress(0);
      } else {
        setProgress(newProgress);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, currentImageIndex]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    setProgress(0); // Reset progress when manually changing
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    setProgress(0); // Reset progress when manually changing
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[60vh] p-2">
        <div className="relative flex-1 flex items-center justify-center p-2">
          <div className="flex items-center justify-center max-w-full max-h-full">
            <img
              src={galleryImages[currentImageIndex].src}
              alt={galleryImages[currentImageIndex].alt}
              className="max-w-full max-h-[48vh] object-contain rounded-lg"
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-50 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};