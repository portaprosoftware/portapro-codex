import React, { useState } from 'react';
import { Camera, TrendingUp, AlertTriangle, MapPin, Clock, Fuel, Settings, Shield, DollarSign, User, FileText, Wrench, Gauge, Eye, Upload, Plus, ChevronDown } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Mock data for Isuzu NPR-HD vehicle matching user's screenshot
const mockVehicle = {
  id: "V001",
  make: "Isuzu",
  model: "NPR-HD",
  year: 2019,
  vin: "JALC4W167K7004583",
  licensePlate: "FL-7583",
  mileage: 137500,
  fuelLevel: 68,
  lastService: "2024-01-15",
  nextService: "2024-02-15",
  status: "Active",
  driver: "Mike Johnson",
  location: "Route 12 - Commercial District",
  dailyMiles: 127,
  averageMpg: 12.8,
  maintenanceCost: 1240,
  fuelCost: 890,
  assignedRoute: "Commercial District - Morning",
  totalFuelThisMonth: 245.6,
  damageReports: 2,
  documentsCount: 14
};

const FleetManagementShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'fuel', label: 'Fuel' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'damage', label: 'Damage Log' },
    { key: 'documents', label: 'Documents' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Vehicle Photos and Current Assignment Side by Side */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Vehicle Photos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src="/lovable-uploads/9abe22a2-0d1c-477b-8f9f-e39843ff0748.png" 
                      alt="2019 Isuzu NPR-HD Fleet Vehicle" 
                      className="w-full h-48 object-cover object-center"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Current Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Assigned Driver</span>
                    <p className="font-semibold text-lg">{mockVehicle.driver}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Current Route</span>
                    <p className="font-semibold">{mockVehicle.assignedRoute}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Location</span>
                    <p className="font-semibold">{mockVehicle.location}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Daily Miles (Today)</span>
                    <p className="font-semibold">{mockVehicle.dailyMiles} miles</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Information - Full Width */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Make</span>
                    <p className="font-semibold text-lg">{mockVehicle.make}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Model</span>
                    <p className="font-semibold text-lg">{mockVehicle.model}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Year</span>
                    <p className="font-semibold">{mockVehicle.year}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">License Plate</span>
                    <p className="font-semibold">{mockVehicle.licensePlate}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Current Mileage</span>
                    <p className="font-semibold">{mockVehicle.mileage.toLocaleString()} miles</p>
                  </div>
                </div>
                {/* VIN on its own row for mobile compatibility */}
                <div className="mt-4">
                  <span className="text-sm text-gray-600">VIN</span>
                  <p className="font-semibold text-sm">{mockVehicle.vin}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'maintenance':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Maintenance Schedule & History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold">Oil Change & Filter</p>
                      <p className="text-sm text-gray-600">Last: {mockVehicle.lastService} • Due: {mockVehicle.nextService}</p>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold">Tire Rotation</p>
                      <p className="text-sm text-gray-600">Last: 2024-01-10 • Due: 2024-03-10</p>
                    </div>
                    <Badge variant="secondary">Due Soon</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold">DOT Inspection</p>
                      <p className="text-sm text-gray-600">Last: 2023-12-15 • Due: 2024-12-15</p>
                    </div>
                    <Badge variant="default">Current</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'fuel':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="w-5 h-5" />
                  Fuel Tracking & Economy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 rounded-lg bg-white border border-gray-200">
                    <p className="text-3xl font-bold">{mockVehicle.fuelLevel}%</p>
                    <p className="text-sm text-gray-600">Current Fuel Level</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-white border border-gray-200">
                    <p className="text-3xl font-bold">{mockVehicle.averageMpg}</p>
                    <p className="text-sm text-gray-600">Average MPG</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <p className="font-semibold">This Month: {mockVehicle.totalFuelThisMonth} gallons</p>
                    <p className="text-sm text-gray-600">Cost: ${mockVehicle.fuelCost}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'assignments':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Driver Assignments & Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-white border border-gray-200">
                    <p className="font-semibold">Current Assignment</p>
                    <p className="text-sm text-gray-600">Driver: {mockVehicle.driver}</p>
                    <p className="text-sm text-gray-600">Route: {mockVehicle.assignedRoute}</p>
                    <p className="text-sm text-gray-600">Start Time: 7:00 AM</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <p className="font-semibold">Previous Assignment</p>
                    <p className="text-sm text-gray-600">Driver: Sarah Wilson • Route: Industrial Zone - Afternoon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'damage':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Damage Reports & Incidents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold">Minor Dent - Rear Panel</p>
                      <p className="text-sm text-gray-600">Reported: 2024-01-20 • Driver: Mike Johnson</p>
                    </div>
                    <Badge variant="secondary">Pending Repair</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold">Scratched Bumper</p>
                      <p className="text-sm text-gray-600">Reported: 2024-01-10 • Driver: Sarah Wilson</p>
                    </div>
                    <Badge variant="default">Repaired</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Total Reports: {mockVehicle.damageReports}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'documents':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Vehicle Documents & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold">Registration</p>
                      <p className="text-sm text-gray-600">Expires: 2024-12-31</p>
                    </div>
                    <Badge variant="default">Valid</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold">Insurance Policy</p>
                      <p className="text-sm text-gray-600">Expires: 2024-08-15</p>
                    </div>
                    <Badge variant="default">Valid</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-white border border-gray-200">
                    <div>
                      <p className="font-semibold">DOT Medical Card</p>
                      <p className="text-sm text-gray-600">Expires: 2024-03-30</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">Expiring Soon</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Total Documents: {mockVehicle.documentsCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transform scale-90 origin-top">
      {/* Header - Reduced padding */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{mockVehicle.year} {mockVehicle.make} {mockVehicle.model} <span className="text-blue-100 text-sm font-normal">• License: {mockVehicle.licensePlate} • VIN: {mockVehicle.vin}</span></h2>
          </div>
          <div className="text-right">
            <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white border-0 text-xs">
              {mockVehicle.status}
            </Badge>
          </div>
        </div>
      </div>


      {/* Navigation Pills - Desktop and Mobile */}
      <div className="p-4">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 mb-4" aria-label="Vehicle navigation tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 font-inter flex items-center gap-2 focus:outline-none transform hover:-translate-y-0.5 ${
                activeTab === tab.key 
                  ? "bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold shadow-sm" 
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 hover:shadow-sm"
              }`}
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Mobile Dropdown Navigation */}
        <div className="md:hidden mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-white">
                {tabs.find(tab => tab.key === activeTab)?.label || 'Select Tab'}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {tabs.map((tab) => (
                <DropdownMenuItem
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 ${
                    activeTab === tab.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export { FleetManagementShowcase };