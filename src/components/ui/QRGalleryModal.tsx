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
    alt: 'QR Codes Print Interface'
  },
  {
    src: qrGallery2,
    alt: 'QR Code Grid Layout'
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
    
    const duration = 3000; // 3 seconds
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
      <DialogContent className="max-w-2xl max-h-[70vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-center">QR Code Print Gallery</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 flex items-center justify-center p-4">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
            onClick={prevImage}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center justify-center max-w-full max-h-full">
            <img
              src={galleryImages[currentImageIndex].src}
              alt={galleryImages[currentImageIndex].alt}
              className="max-w-full max-h-[50vh] object-contain rounded-lg"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
            onClick={nextImage}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-50 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-center gap-2 p-4">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => {
                setCurrentImageIndex(index);
                setProgress(0); // Reset progress when manually selecting
              }}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};