import React, { useState, useEffect } from 'react';
import { QRGenerator } from '@/components/ui/qr-generator';
import { Camera, Smartphone, Eye } from 'lucide-react';

const PanelScanningCard: React.FC = () => {
  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-primary" />
        <h4 className="text-lg font-semibold">Snap & Track Units from Embedded Plastic Text Numbers</h4>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gray-900 rounded-lg p-4 relative">
            <div className="w-48 h-64 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
              {/* Phone mockup */}
              <div className="absolute inset-2 bg-gray-800 rounded-lg flex flex-col">
                <div className="flex-1 bg-gray-700 m-2 rounded flex items-center justify-center">
                  <div className="text-white text-xs space-y-1 text-center">
                    <div>T-207788-1A</div>
                    <div className="text-gray-400">ABC Manufacturing</div>
                    <div className="text-gray-400">Vendor ID: 32123</div>
                    <div className="text-gray-400">January 13, 2016</div>
                    <div className="text-gray-400">HDPE</div>
                  </div>
                </div>
                <div className="h-12 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-gray-600 border-4 border-gray-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
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