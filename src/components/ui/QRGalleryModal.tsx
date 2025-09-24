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

  // Auto-rotation timer
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
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

        <div className="flex justify-center gap-2 p-4">
          {galleryImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-primary' : 'bg-muted'
              }`}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};