import React from 'react';
import { MapPin, Navigation, Wifi, WifiOff, Phone, Camera, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import satelliteMap from '@/assets/satellite-map.png';

export const MobileAppMockup: React.FC = () => {
  return (
    <div className="relative mx-auto">
      {/* iPhone Frame */}
      <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
        <div className="bg-white rounded-[2.5rem] overflow-hidden relative" style={{ width: '320px', height: '640px' }}>
          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 pt-3 pb-1 bg-white">
            <span className="text-sm font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                <div className="w-1 h-1 bg-black rounded-full"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              </div>
              <Wifi className="w-4 h-4 ml-2" />
              <div className="w-6 h-3 border border-black rounded-sm">
                <div className="w-4 h-full bg-green-500 rounded-sm"></div>
              </div>
            </div>
          </div>

          {/* App Content */}
          <div className="px-4 pb-4 bg-gray-50 h-full">
            {/* Header */}
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                  <Navigation className="w-3 h-3 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Optimized Route</h3>
                  <p className="text-xs text-gray-500">Today, delivered to 4 out of 6 stops</p>
                </div>
              </div>
            </div>

            {/* Job Locations */}
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">ACME Construction</span>
                  <span className="text-xs text-gray-500">— 1250 Market</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">City Park North</span>
                  <span className="text-xs text-gray-500">— 4450 E 23rd Ave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Riverside Site</span>
                  <span className="text-xs text-gray-500">— 3600 S Platte Canyon Rd</span>
                </div>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Use PortaPro Navigation</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  Apple
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Google
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Waze
                </Button>
              </div>
            </div>

            {/* Precise Drop-off */}
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Precise Drop-off Pin</span>
              </div>
              
              {/* Satellite Map Mock */}
              <div className="relative h-24 rounded-md overflow-hidden">
                <img 
                  src={satelliteMap} 
                  alt="Satellite view of job site" 
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Satellite view for exact placement</p>
            </div>

            {/* Offline Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">Offline mode active — actions queued.</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Auto-sync when back online.</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button className="bg-green-600 hover:bg-green-700 text-white text-sm">
                <Camera className="w-4 h-4 mr-1" />
                Photo
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div>
        </div>
      </div>
    </div>
  );
};