import React, { useState } from 'react';
import { Truck, MapPin, Wrench, Shield, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock fleet data
const mockFleetData = {
  vehicles: [
    {
      id: 1,
      name: "Isuzu NPR-HD #1001",
      status: "Active",
      location: "Downtown Route",
      mileage: "45,230",
      lastService: "2024-01-15",
      nextService: "2024-03-15"
    },
    {
      id: 2,
      name: "Ford Transit #1002", 
      status: "Maintenance",
      location: "Service Center",
      mileage: "38,450",
      lastService: "2024-01-20",
      nextService: "2024-03-20"
    },
    {
      id: 3,
      name: "Chevrolet Express #1003",
      status: "Active",
      location: "Westside Route",
      mileage: "52,180",
      lastService: "2024-01-10",
      nextService: "2024-03-10"
    }
  ],
  stats: {
    totalVehicles: 12,
    activeVehicles: 10,
    inMaintenance: 2,
    upcomingServices: 3
  }
};

export const FleetManagementShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'vehicles', label: 'Vehicles', icon: Truck },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'reports', label: 'Reports', icon: ClipboardCheck }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="font-medium">{mockFleetData.stats.totalVehicles} Total Vehicles</span>
                </div>
              </div>
              <div className="bg-green-500/10 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{mockFleetData.stats.activeVehicles} Active</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Fleet performance metrics and real-time status monitoring
            </div>
          </div>
        );
      case 'vehicles':
        return (
          <div className="space-y-3">
            {mockFleetData.vehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{vehicle.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {vehicle.location}
                    </div>
                  </div>
                  <Badge variant={vehicle.status === 'Active' ? 'default' : 'secondary'}>
                    {vehicle.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        );
      case 'maintenance':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">{mockFleetData.stats.upcomingServices} Upcoming Services</span>
            </div>
            <div className="space-y-2">
              {mockFleetData.vehicles.filter(v => v.status === 'Maintenance').map((vehicle) => (
                <div key={vehicle.id} className="p-3 border rounded-lg bg-orange-50">
                  <div className="text-sm font-medium">{vehicle.name}</div>
                  <div className="text-xs text-muted-foreground">Service due: {vehicle.nextService}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'compliance':
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              DOT compliance tracking and document management
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center p-2 border rounded">
                <span className="text-sm">Driver Licenses</span>
                <Badge variant="default">Up to Date</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span className="text-sm">Vehicle Inspections</span>
                <Badge variant="default">Compliant</Badge>
              </div>
              <div className="flex justify-between items-center p-2 border rounded">
                <span className="text-sm">Insurance</span>
                <Badge variant="secondary">Expiring Soon</Badge>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Generate comprehensive fleet performance reports
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Fuel Efficiency Report
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Maintenance Cost Analysis
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Driver Performance
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Fleet Management Made Simple
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Monitor your entire fleet in real-time with comprehensive tracking, maintenance scheduling, and compliance management
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Fleet Overview Panel */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Fleet Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{mockFleetData.stats.totalVehicles}</div>
                    <div className="text-sm text-muted-foreground">Total Vehicles</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/5 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{mockFleetData.stats.activeVehicles}</div>
                    <div className="text-sm text-muted-foreground">Active Now</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recent Activity</h4>
                  {mockFleetData.vehicles.slice(0, 3).map((vehicle) => (
                    <div key={vehicle.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{vehicle.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {vehicle.location}
                        </div>
                      </div>
                      <Badge variant={vehicle.status === 'Active' ? 'default' : 'secondary'}>
                        {vehicle.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Management Interface Panel */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Fleet Management Center</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <tab.icon className="h-3 w-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {renderTabContent()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Real-time Tracking</h3>
            <p className="text-sm text-muted-foreground">Monitor vehicle locations and routes in real-time</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Smart Maintenance</h3>
            <p className="text-sm text-muted-foreground">Automated scheduling based on mileage and time</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Compliance Ready</h3>
            <p className="text-sm text-muted-foreground">Stay compliant with DOT regulations automatically</p>
          </div>
        </div>
      </div>
    </section>
  );
};