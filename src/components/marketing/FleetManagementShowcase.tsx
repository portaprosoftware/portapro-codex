import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  MapPin, 
  CheckCircle,
  Calendar,
  FileText,
  BarChart3,
  Fuel,
  Wrench,
  Route,
  Shield,
  DollarSign
} from 'lucide-react';

// Mock vehicle data for demonstration
const mockVehicleData = {
  vehicleInfo: {
    id: 'VH-001',
    licensePlate: 'ABC-1234',
    make: 'Ford',
    model: 'F-350',
    year: 2022,
    type: 'Service Truck',
    status: 'Active',
    driver: 'John Smith',
    currentLocation: 'Downtown Route 45',
    mileage: 45678,
    fuelLevel: 75,
    lastService: '2024-01-15',
    nextServiceDue: '2024-03-15'
  },
  stats: [
    {
      title: 'Current Mileage',
      value: '45,678',
      icon: MapPin,
      color: 'blue',
      subtitle: 'Miles driven'
    },
    {
      title: 'Last Service',
      value: '30 days',
      icon: Wrench,
      color: 'green',
      subtitle: 'Days ago'
    },
    {
      title: 'Fuel Level',
      value: '75%',
      icon: Fuel,
      color: 'yellow',
      subtitle: 'Tank capacity'
    },
    {
      title: 'Status',
      value: 'Active',
      icon: CheckCircle,
      color: 'green',
      subtitle: 'Currently on route'
    }
  ]
};

export const FleetManagementShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'routes', label: 'Route History' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'performance', label: 'Performance' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Make/Model:</span>
                  <span className="ml-2 font-medium">{mockVehicleData.vehicleInfo.make} {mockVehicleData.vehicleInfo.model}</span>
                </div>
                <div>
                  <span className="text-gray-600">Year:</span>
                  <span className="ml-2 font-medium">{mockVehicleData.vehicleInfo.year}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{mockVehicleData.vehicleInfo.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Driver:</span>
                  <span className="ml-2 font-medium">{mockVehicleData.vehicleInfo.driver}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Current Location</h4>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{mockVehicleData.vehicleInfo.currentLocation}</span>
              </div>
            </div>
          </div>
        );
      case 'maintenance':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Service History</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Oil Change & Filter</p>
                      <p className="text-sm text-gray-600">January 15, 2024</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Brake Inspection</p>
                      <p className="text-sm text-gray-600">March 15, 2024</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
                </div>
              </div>
            </div>
          </div>
        );
      case 'routes':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Recent Routes</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Route className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Downtown Route 45</p>
                      <p className="text-sm text-gray-600">Today, 8:30 AM - 3:45 PM</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">127 miles</p>
                    <p className="text-gray-600">7.2 hours</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Route className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">North Industrial Route</p>
                      <p className="text-sm text-gray-600">Yesterday, 9:00 AM - 4:30 PM</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">156 miles</p>
                    <p className="text-gray-600">7.5 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'compliance':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">DOT Compliance Status</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Vehicle Registration</p>
                      <p className="text-sm text-gray-600">Expires: December 2024</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Valid</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Insurance Policy</p>
                      <p className="text-sm text-gray-600">Expires: August 2024</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Valid</Badge>
                </div>
              </div>
            </div>
          </div>
        );
      case 'performance':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Fuel Efficiency</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">12.5 MPG</p>
                  <p className="text-sm text-blue-700">+0.8 vs last month</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Driver Score</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">87/100</p>
                  <p className="text-sm text-purple-700">Excellent rating</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
      {/* Vehicle Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{mockVehicleData.vehicleInfo.licensePlate}</h3>
            <p className="text-gray-600">{mockVehicleData.vehicleInfo.make} {mockVehicleData.vehicleInfo.model} • {mockVehicleData.vehicleInfo.type}</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          {mockVehicleData.vehicleInfo.status}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {mockVehicleData.stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              stat.color === 'blue' ? 'bg-gradient-to-b from-blue-400 to-blue-600' :
              stat.color === 'green' ? 'bg-gradient-to-b from-green-400 to-green-600' :
              stat.color === 'yellow' ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' :
              'bg-gradient-to-b from-gray-400 to-gray-600'
            }`}></div>
            <CardContent className="p-4 pl-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'yellow' ? 'text-yellow-600' :
                  'text-gray-600'
                }`} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-900">{stat.title}</p>
                <p className="text-xs text-gray-600">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {renderTabContent()}
      </div>
    </div>
  );
};