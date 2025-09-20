import React, { useState, useEffect, useRef } from 'react';
import { TabNav } from '@/components/ui/TabNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCustomerTypeColor, getCustomerTypeIcon } from '@/lib/customerTypeIcons';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  unitsInMaintenance: 3,
  brokenUnits: [
    { unitCode: '1103', issue: 'Door hinge broken', priority: 'High', dateReported: '2024-01-15', technician: 'Mike Johnson', status: 'In Progress' },
    { unitCode: '1087', issue: 'Vent fan not working', priority: 'Medium', dateReported: '2024-01-12', technician: 'Sarah Wilson', status: 'Parts Ordered' },
    { unitCode: '1045', issue: 'Lock mechanism stuck', priority: 'Low', dateReported: '2024-01-10', technician: 'Tom Davis', status: 'Completed' }
  ]
};

const mockAssignmentData = {
  assignments: [
    { 
      id: '1101',
      jobNumber: 'J-2024-156', 
      customer: 'ABC Construction', 
      customerType: 'construction' as const,
      site: 'Downtown Office Complex',
      coordinates: [-74.006, 40.7128] as [number, number], // NYC
      status: 'active' as const,
      assignedDate: '2024-01-10',
      estimatedReturn: '2024-02-28'
    },
    { 
      id: '1102',
      jobNumber: 'J-2024-144', 
      customer: 'Metro Builders', 
      customerType: 'construction' as const,
      site: 'Riverside Shopping Center',
      coordinates: [-74.0234, 40.7282] as [number, number], // NYC area
      status: 'pickup' as const,
      assignedDate: '2024-01-08',
      estimatedReturn: '2024-01-20'
    },
    { 
      id: '1103',
      jobNumber: 'J-2024-133', 
      customer: 'City Events LLC', 
      customerType: 'events_festivals' as const,
      site: 'Central Park Festival',
      coordinates: [-73.9654, 40.7829] as [number, number], // Central Park
      status: 'active' as const,
      assignedDate: '2024-01-05',
      estimatedReturn: '2024-01-20'
    },
    { 
      id: '1104',
      jobNumber: 'J-2024-167', 
      customer: 'Summit Retail Group', 
      customerType: 'retail' as const,
      site: 'Westfield Mall Renovation',
      coordinates: [-74.0445, 40.7589] as [number, number], 
      status: 'active' as const,
      assignedDate: '2024-01-12',
      estimatedReturn: '2024-02-01'
    },
    { 
      id: '1105',
      jobNumber: 'J-2024-151', 
      customer: 'Emergency Response NYC', 
      customerType: 'emergency_disaster_relief' as const,
      site: 'Brooklyn Bridge Repairs',
      coordinates: [-73.9969, 40.7061] as [number, number], 
      status: 'pickup' as const,
      assignedDate: '2024-01-06',
      estimatedReturn: '2024-01-19'
    },
    { 
      id: '1106',
      jobNumber: 'J-2024-142', 
      customer: 'Municipal Works Dept', 
      customerType: 'municipal_government' as const,
      site: 'Central Park Maintenance',
      coordinates: [-73.9712, 40.7831] as [number, number], 
      status: 'active' as const,
      assignedDate: '2024-01-03',
      estimatedReturn: '2024-02-15'
    },
    { 
      id: '1107',
      jobNumber: 'J-2024-159', 
      customer: 'Elite Weddings Co', 
      customerType: 'private_events_weddings' as const,
      site: 'Brooklyn Botanical Garden',
      coordinates: [-73.9641, 40.6681] as [number, number], 
      status: 'active' as const,
      assignedDate: '2024-01-11',
      estimatedReturn: '2024-01-21'
    },
    { 
      id: '1108',
      jobNumber: 'J-2024-163', 
      customer: 'Sports Arena Management', 
      customerType: 'sports_recreation' as const,
      site: 'Yankees Stadium Event',
      coordinates: [-73.9288, 40.8296] as [number, number], 
      status: 'pickup' as const,
      assignedDate: '2024-01-09',
      estimatedReturn: '2024-01-18'
    },
    { 
      id: '1109',
      jobNumber: 'J-2024-171', 
      customer: 'Uptown Bar & Grill', 
      customerType: 'bars_restaurants' as const,
      site: 'Rooftop Renovation',
      coordinates: [-73.9857, 40.7484] as [number, number], 
      status: 'active' as const,
      assignedDate: '2024-01-13',
      estimatedReturn: '2024-02-10'
    },
    { 
      id: '1110',
      jobNumber: 'J-2024-145', 
      customer: 'General Contractors Inc', 
      customerType: 'other' as const,
      site: 'Staten Island Development',
      coordinates: [-74.1502, 40.6195] as [number, number], 
      status: 'pickup' as const,
      assignedDate: '2024-01-07',
      estimatedReturn: '2024-01-19'
    }
  ]
};

interface Assignment {
  id: string;
  jobNumber: string;
  customer: string;
  customerType: string;
  site: string;
  coordinates: [number, number];
  status: 'active' | 'pickup';
  assignedDate: string;
  estimatedReturn: string;
}

const AssignmentsMap = ({ assignments }: { assignments: Assignment[] }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isSatelliteView, setIsSatelliteView] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Use a placeholder token - user needs to add their actual token
    mapboxgl.accessToken = 'pk.eyJ1IjoicG9ydGFwcm9zb2Z0d2FyZSIsImEiOiJjbWJybnBnMnIwY2x2Mm1wd3p2MWdqY2FnIn0.7ZIJ7ufeGtn-ufiOGJpq1Q';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Colorful streets style
      center: [-74.006, 40.7128], // NYC
      zoom: 11
    });

    // Add markers for each assignment
    assignments.forEach((assignment) => {
      const customerColor = getCustomerTypeColor(assignment.customerType);
      const bgColor = customerColor.replace('bg-', '').replace('-500', '').replace('-600', '');
      
      // Convert Tailwind color classes to hex values
      const colorMap: Record<string, string> = {
        'orange': '#ea580c',
        'yellow': '#ca8a04', 
        'red': '#dc2626',
        'purple': '#9333ea',
        'blue': '#2563eb',
        'pink': '#db2777',
        'green': '#16a34a',
        'indigo': '#4f46e5',
        'gray': '#6b7280'
      };
      
      const hexColor = colorMap[bgColor] || '#6b7280';
      const statusColor = assignment.status === 'pickup' ? '#2563eb' : '#16a34a'; // Blue for pickup, green for active
      
      const el = document.createElement('div');
      el.className = 'assignment-marker';
      el.innerHTML = `
        <div style="
          width: 24px; 
          height: 24px; 
          background: ${statusColor}; 
          border: 2px solid white;
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 10px; 
          font-weight: bold; 
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${assignment.id.slice(-2)}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${assignment.jobNumber}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;"><strong>Customer:</strong> ${assignment.customer}</p>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;"><strong>Site:</strong> ${assignment.site}</p>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;"><strong>Status:</strong> 
            <span style="color: ${assignment.status === 'active' ? '#16a34a' : '#2563eb'}; font-weight: 600;">
              ${assignment.status === 'active' ? 'Active Assignment' : 'Pickup Today'}
            </span>
          </p>
          <p style="margin: 0; font-size: 12px; color: #666;"><strong>Est. Return:</strong> ${assignment.estimatedReturn}</p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat(assignment.coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Fit map to show all markers
    if (assignments.length > 0) {
      const coordinates = assignments.map(assignment => assignment.coordinates);
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }

    return () => {
      map.current?.remove();
    };
  }, [assignments]);

  const toggleSatelliteView = () => {
    if (map.current) {
      const newStyle = isSatelliteView 
        ? 'mapbox://styles/mapbox/streets-v12' 
        : 'mapbox://styles/mapbox/satellite-v9';
      map.current.setStyle(newStyle);
      setIsSatelliteView(!isSatelliteView);
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Header */}
      <div className="bg-muted rounded-lg p-4 text-center">
        <div className="text-xl font-bold text-foreground">Job Assignments Map</div>
        <div className="text-sm text-muted-foreground mt-1">
          {assignments.length} units currently deployed
        </div>
      </div>

      {/* Map Controls and Container */}
      <div className="border rounded-lg overflow-hidden relative">
        <div className="absolute top-3 left-3 z-10">
          <Button 
            onClick={toggleSatelliteView}
            variant="outline"
            size="sm"
            className="bg-white/90 hover:bg-white text-foreground shadow-sm"
          >
            {isSatelliteView ? 'Street View' : 'Satellite'}
          </Button>
        </div>
        <div ref={mapContainer} className="w-full h-64" />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          <span className="text-sm text-foreground">Active Assignment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
          <span className="text-sm text-foreground">Pickup Today</span>
        </div>
      </div>
    </div>
  );
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
              <div className="flex flex-col gap-3 justify-center items-center w-full h-full">
                <h5 className="font-semibold text-foreground text-base">Status:</h5>
                <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-2 rounded-full font-bold text-sm text-center whitespace-nowrap w-full">
                  {mockStockData.totalAvailable} Available
                </div>
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-2 rounded-full font-bold text-sm text-center whitespace-nowrap w-full">
                  On Assignment {mockStockData.totalAssigned}
                </div>
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-2 rounded-full font-bold text-sm text-center whitespace-nowrap w-full">
                  Maintenance {mockStockData.totalMaintenance}
                </div>
              </div>

              {/* Right Column - Inventory by Location */}
              <div className="flex flex-col justify-center h-full w-full">
                <div className="space-y-3">
                  <h5 className="font-semibold text-foreground text-base text-center">Inventory by Location</h5>
                  <div className="grid gap-2">
                    {mockStockData.bulkStock.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg w-full">
                        <div className="flex items-center gap-2 flex-1">
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
            <div className="bg-muted rounded-lg p-4 text-center">
              <div className="text-xl font-bold text-foreground">Daily Availability Overview</div>
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Start Date</label>
                  <div className="p-2 border rounded bg-background text-sm min-w-[120px]">
                    {startDate.toLocaleDateString()}
                  </div>
                </div>
                <span className="text-muted-foreground mt-4">to</span>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">End Date</label>
                  <div className="p-2 border rounded bg-background text-sm min-w-[120px]">
                    {endDate.toLocaleDateString()}
                  </div>
                </div>
            </div>

            {/* Inventory Request */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Inventory Request
              </h5>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-600 to-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
                <div>
                  <div className="text-sm font-bold text-white">20 units requested</div>
                  <div className="text-xs font-bold text-white">Available for selected dates</div>
                </div>
              </div>
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
            {/* Maintenance Overview */}
            <div className="border rounded-lg p-4 text-center bg-muted">
              <div className="text-xl font-bold text-foreground">{mockMaintenanceData.unitsInMaintenance} Units in Maintenance</div>
              <div className="text-sm text-muted-foreground">Currently being repaired</div>
            </div>

            {/* Broken Units List */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Broken Units & Repairs
              </h5>
              <div className="space-y-2">
                {mockMaintenanceData.brokenUnits.map((unit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-mono font-medium">{unit.unitCode}</span>
                        <Badge 
                          className={`text-xs font-bold text-white ${
                            unit.priority === 'High' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                            unit.priority === 'Medium' ? 'bg-gradient-to-r from-orange-600 to-orange-500' :
                            'bg-gradient-to-r from-blue-600 to-blue-500'
                          }`}
                        >
                          {unit.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-foreground">{unit.issue}</div>
                      <div className="text-xs text-muted-foreground">
                        Reported: {unit.dateReported} • {unit.technician}
                      </div>
                    </div>
                    <Badge 
                      className={`text-xs font-bold text-white ml-3 ${
                        unit.status === 'Completed' ? 'bg-gradient-to-r from-green-600 to-green-500' :
                        unit.status === 'In Progress' ? 'bg-gradient-to-r from-blue-600 to-blue-500' :
                        'bg-gradient-to-r from-yellow-600 to-yellow-500'
                      }`}
                    >
                      {unit.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'qr-tracking':
        const sampleQrCodes = [
          { unitCode: '1101', type: 'Standard Portable Toilet' },
          { unitCode: '1102', type: 'Standard Portable Toilet' },
          { unitCode: '1103', type: 'Standard Portable Toilet' }
        ];
        
        return (
          <div className="space-y-4">
            {/* QR Codes List */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-foreground">Unit QR Codes</h5>
                <Button size="sm" className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                  Print Selected
                </Button>
              </div>
              <div className="grid gap-3">
                {sampleQrCodes.map((unit, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <div className="w-16 h-16 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-mono font-medium">{unit.unitCode}</div>
                      <div className="text-xs text-muted-foreground">{unit.type}</div>
                    </div>
                  </div>
                ))}
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
          </div>
        );

      case 'assignments':
        return <AssignmentsMap assignments={mockAssignmentData.assignments} />;

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