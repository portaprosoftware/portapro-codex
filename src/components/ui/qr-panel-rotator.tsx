import React, { useState, useEffect } from 'react';
import { QRGenerator } from '@/components/ui/qr-generator';
import { Camera, Smartphone, Eye } from 'lucide-react';

const PanelScanningCard: React.FC = () => {
  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="mb-4">
        <h4 className="text-base font-normal">Snap & Track Units from Embedded Plastic Text Numbers</h4>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-lg overflow-hidden">
            <img 
              src="/lovable-uploads/4ba172a8-8093-4d4e-9143-53090809b31e.png" 
              alt="Phone scanning embossed plastic text on portable toilet unit"
              className="w-full max-w-sm h-auto"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="bg-gradient-green text-white px-3 py-1 rounded-full text-sm font-bold inline-block">
              ✓ Successfully tracked
            </div>
            
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Vendor:</span> ABC Manufacturing</div>
              <div><span className="font-medium">Tool No:</span> T-207788-1A</div>
              <div><span className="font-medium">Vendor ID:</span> 32123</div>
              <div><span className="font-medium">Mfg Date:</span> January 13, 2016</div>
              <div><span className="font-medium">Plastic:</span> HDPE</div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Works offline — syncs later. Instant attach to units & jobs.
          </p>
        </div>
      </div>
    </div>
  );
};

export const QRPanelRotator: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 2);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="transition-opacity duration-500">
        {currentIndex === 0 ? <QRGenerator /> : <PanelScanningCard />}
      </div>
      
      {/* Indicator dots */}
      <div className="flex justify-center gap-2 mt-4">
        <div 
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            currentIndex === 0 ? 'bg-primary' : 'bg-gray-300'
          }`}
        />
        <div 
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            currentIndex === 1 ? 'bg-primary' : 'bg-gray-300'
          }`}
        />
      </div>
    </div>
  );
};