import React, { useState } from 'react';
import { TabNav } from '@/components/ui/TabNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  MapPin, 
  Calendar, 
  Wrench, 
  QrCode, 
  Clipboard,
  CheckCircle,
  AlertTriangle,
  Clock,
  Truck,
  User,
  Building,
  Camera,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

interface TabData {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

const tabs: TabData[] = [
  { id: 'overview', label: 'Overview', icon: Package },
  { id: 'stock', label: 'Stock Levels', icon: Package },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'qr-tracking', label: 'QR & Tracking', icon: QrCode },
  { id: 'assignments', label: 'Assignments', icon: Clipboard }
];

const mockUnitData = {
  unitCode: '1101',
  productName: 'Standard Portable Toilet',
  toolNumber: 'T-10788-1A',
  condition: 'Excellent',
  currentLocation: 'Yard A - Section 3',
  status: 'Available',
  daysSinceService: 12,
  totalJobs: 47,
  lastCustomer: 'ABC Construction'
};

const mockStockData = {
  bulkStock: [
    { location: 'Yard A', quantity: 48, lowStockThreshold: 20 },
    { location: 'Yard B', quantity: 14, lowStockThreshold: 15 },
    { location: 'Warehouse', quantity: 20, lowStockThreshold: 10 }
  ],
  individualUnits: [
    { code: '1101', status: 'Available', location: 'Yard A' },
    { code: '1102', status: 'Assigned', location: 'Job Site' },
    { code: '1103', status: 'Maintenance', location: 'Service Bay' },
    { code: '1104', status: 'Available', location: 'Yard B' }
  ],
  totalAvailable: 45,
  totalAssigned: 17,
  totalMaintenance: 3
};

const mockMaintenanceData = {
  lastService: '2024-01-08',
  nextDue: '2024-02-15',
  workOrders: [
    { date: '2024-01-08', type: 'Routine Service', technician: 'Mike Johnson', status: 'Completed' },
    { date: '2023-12-15', type: 'Deep Clean', technician: 'Sarah Wilson', status: 'Completed' },
    { date: '2023-11-20', type: 'Repair - Door', technician: 'Tom Davis', status: 'Completed' }
  ],
  upcomingService: { date: '2024-02-15', type: 'Routine Service', technician: 'TBD' }
};

const mockAssignmentData = {
  currentJob: {
    jobNumber: 'J-2024-156',
    customer: 'ABC Construction',
    site: 'Downtown Office Complex',
    assignedDate: '2024-01-10',
    estimatedReturn: '2024-02-28'
  },
  history: [
    { jobNumber: 'J-2024-123', customer: 'Metro Builders', duration: '18 days', rating: 5 },
    { jobNumber: 'J-2024-089', customer: 'City Events LLC', duration: '3 days', rating: 5 },
    { jobNumber: 'J-2024-067', customer: 'ABC Construction', duration: '21 days', rating: 4 }
  ]
};

export function InventoryManagementShowcase() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-2">
            {/* Product Header */}
            <div className="text-center mb-2">
              <h4 className="text-xl font-semibold text-foreground">{mockUnitData.productName}</h4>
            </div>

            {/* Three Column Layout - Fixed Height to Match Image */}
            <div className="grid grid-cols-3 gap-4 items-start justify-items-center h-64">
              {/* Left Column - Image */}
              <div className="flex justify-center h-full">
                <img 
                  src="/assets/standard-unit.png" 
                  alt="Standard Portable Toilet" 
                  className="w-full max-w-60 h-full object-contain rounded-lg"
                />
              </div>

              {/* Middle Column - Status Badges */}
              <div className="flex flex-col gap-2 justify-center items-center w-full h-full">
                <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-1.5 rounded-full font-bold text-sm text-center whitespace-nowrap w-full max-w-40">
                  {mockStockData.totalAvailable} Available
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-1.5 rounded-full font-bold text-sm text-center whitespace-nowrap w-full max-w-40">
                  On Assignment {mockStockData.totalAssigned}
                </div>
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-1.5 rounded-full font-bold text-sm text-center whitespace-nowrap w-full max-w-40">
                  Maintenance {mockStockData.totalMaintenance}
                </div>
              </div>

              {/* Right Column - Inventory by Location */}
              <div className="flex flex-col justify-center h-full w-full">
                <div className="space-y-3">
                  <h5 className="font-semibold text-foreground text-base text-center">Inventory by Location</h5>
                  <div className="grid gap-2">
                    {mockStockData.bulkStock.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{location.location}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{location.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'stock':
        return (
          <div className="space-y-4">
            {/* Stock Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{mockStockData.totalAvailable}</div>
                <div className="text-xs text-white">Available</div>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{mockStockData.totalAssigned}</div>
                <div className="text-xs text-white">On Job</div>
              </div>
              <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{mockStockData.totalMaintenance}</div>
                <div className="text-xs text-white">Maintenance</div>
              </div>
            </div>

            {/* Bulk Stock by Location */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Bulk Stock by Location
              </h5>
              <div className="space-y-2">
                {mockStockData.bulkStock.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{location.location}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{location.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Units Sample */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4" /> Individual Units (Sample)
              </h5>
              <div className="space-y-2">
                {mockStockData.individualUnits.map((unit, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-mono">{unit.code}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{unit.location}</span>
                      <Badge 
                        className={`text-xs font-bold text-white ${
                          unit.status === 'Available' ? 'bg-gradient-to-r from-green-600 to-green-500' :
                          unit.status === 'Assigned' ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                          'bg-gradient-to-r from-orange-600 to-orange-500'
                        }`}
                      >
                        {unit.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'availability':
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 7); // 7 days from now
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 14); // 14 days from now
        
        // Generate calendar days between start and end date
        const calendarDays = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          calendarDays.push({
            date: new Date(currentDate),
            available: Math.floor(Math.random() * 20) + 40, // Random availability between 40-59
            total: 62
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return (
          <div className="space-y-4">
            {/* Date Range Summary */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">Daily Availability Overview</div>
              <div className="text-sm text-white mt-1">
                {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
              </div>
            </div>

            {/* Calendar View */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Daily Unit Availability
              </h5>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {calendarDays.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium min-w-[100px]">
                        {day.date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full" 
                          style={{ width: `${(day.available / day.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {day.available} of {day.total}
                      </span>
                      <span className="text-xs text-muted-foreground">available</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Breakdown */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3">Current Inventory by Location</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Yard A</span>
                  <span className="font-medium">28 units</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Yard B</span>
                  <span className="font-medium">14 units</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">Warehouse</span>
                  <span className="font-medium">20 units</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-4">
            {/* Service Status */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-foreground mb-2">Last Service</h5>
                <div className="text-2xl font-bold text-green-700">{mockMaintenanceData.lastService}</div>
                <div className="text-sm text-muted-foreground">Routine Service</div>
              </div>
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-foreground mb-2">Next Service Due</h5>
                <div className="text-2xl font-bold text-orange-700">{mockMaintenanceData.nextDue}</div>
                <div className="text-sm text-muted-foreground">In 23 days</div>
              </div>
            </div>

            {/* Work Orders */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Clipboard className="w-4 h-4" /> Recent Work Orders
              </h5>
              <div className="space-y-2">
                {mockMaintenanceData.workOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="text-sm font-medium">{order.type}</div>
                      <div className="text-xs text-muted-foreground">{order.date} • {order.technician}</div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Service */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Upcoming Service
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm font-medium">{mockMaintenanceData.upcomingService.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="text-sm font-medium">{mockMaintenanceData.upcomingService.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Technician:</span>
                  <span className="text-sm font-medium">{mockMaintenanceData.upcomingService.technician}</span>
                </div>
              </div>
              <Button className="w-full mt-3" size="sm" variant="outline">
                Schedule Technician
              </Button>
            </div>
          </div>
        );

      case 'qr-tracking':
        return (
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="border rounded-lg p-4 text-center">
              <h5 className="font-medium text-foreground mb-3">QR Code for Unit {mockUnitData.unitCode}</h5>
              <div className="w-32 h-32 mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="text-sm font-mono text-muted-foreground mb-3">{mockUnitData.unitCode} • {mockUnitData.productName}</div>
              <div className="flex gap-2 justify-center">
                <Button size="sm" className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                  Generate
                </Button>
                <Button size="sm" variant="outline">
                  Print
                </Button>
              </div>
            </div>

            {/* Scanning Capabilities */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Scanning Options
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-blue-500" />
                    <span>QR Code scanning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-green-500" />
                    <span>Embossed plastic reading</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-500" />
                    <span>Mobile app integration</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> Offline Capabilities
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-orange-500" />
                    <span>Works without internet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    <span>Auto-sync when online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No data loss</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Scans */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3">Recent Scans</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div>
                    <div className="text-sm font-medium">1101 Scanned</div>
                    <div className="text-xs text-muted-foreground">2 minutes ago • Job Assignment</div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <div className="text-sm font-medium">1102 Scanned</div>
                    <div className="text-xs text-muted-foreground">15 minutes ago • Maintenance Check</div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'assignments':
        return (
          <div className="space-y-4">
            {/* Current Assignment */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Current Assignment
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Job Number:</span>
                  <span className="text-sm font-medium">{mockAssignmentData.currentJob.jobNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Customer:</span>
                  <span className="text-sm font-medium">{mockAssignmentData.currentJob.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Site:</span>
                  <span className="text-sm font-medium">{mockAssignmentData.currentJob.site}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Assigned:</span>
                  <span className="text-sm font-medium">{mockAssignmentData.currentJob.assignedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Est. Return:</span>
                  <span className="text-sm font-medium">{mockAssignmentData.currentJob.estimatedReturn}</span>
                </div>
              </div>
              <Button className="w-full mt-3" size="sm" variant="outline">
                View Job Details
              </Button>
            </div>

            {/* Assignment History */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Clipboard className="w-4 h-4" /> Assignment History
              </h5>
              <div className="space-y-2">
                {mockAssignmentData.history.map((assignment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="text-sm font-medium">{assignment.jobNumber}</div>
                      <div className="text-xs text-muted-foreground">{assignment.customer} • {assignment.duration}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(assignment.rating)].map((_, i) => (
                        <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">4.7</div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">14</div>
                <div className="text-sm text-muted-foreground">Avg Days/Job</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
      {/* Interactive Demo Info */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground">
          Interactive: Click the tabs below to explore different inventory management features
        </p>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold text-foreground">{mockUnitData.productName}</h4>
        <Package className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 overflow-x-auto">
        <TabNav ariaLabel="Inventory management features">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabNav.Item
                key={tab.id}
                to={`#${tab.id}`}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabNav.Item>
            );
          })}
        </TabNav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </article>
  );
}