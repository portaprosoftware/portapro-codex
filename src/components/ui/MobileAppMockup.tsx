import React from 'react';
import { MapPin, Navigation, Wifi, WifiOff, Phone, Camera, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import satelliteMap from '@/assets/satellite-map.png';

export const MobileAppMockup: React.FC = () => {
  return (
    <div className="relative mx-auto">
      {/* iPhone Frame */}
      <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
        <div className="bg-white rounded-[2.5rem] overflow-hidden relative" style={{ width: '288px', height: '576px' }}>
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black rounded-full z-10" style={{ width: '100px', height: '24px' }}></div>
          
          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 pt-8 pb-1 bg-white">
            <span className="text-sm font-semibold">9:41</span>
            <div className="flex items-center gap-1">
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
                  <p className="text-xs text-gray-500">Today, completed 4 of 6 stops</p>
                </div>
              </div>
            </div>

            {/* Job Locations */}
            <div className="bg-white rounded-lg p-2 mb-3 shadow-sm">
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <span className="text-sm font-medium text-blue-600">123 Construction</span>
                    <span className="text-xs text-gray-500"> — 78 W. 9th St • Delivery</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <span className="text-sm font-medium text-blue-600">Metro Park East</span>
                    <span className="text-xs text-gray-500"> — 220 E 32nd Ave • Delivery</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                  <div>
                    <span className="text-sm font-medium text-blue-600">Lakeside Club</span>
                    <span className="text-xs text-gray-500"> — 3600 Lakeside Ave • Service</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
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
                <span className="text-sm font-semibold text-gray-900">Drop-off Pins</span>
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
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-bold text-gray-900">Offline mode active — actions queued.</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Auto-sync when back online.</p>
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