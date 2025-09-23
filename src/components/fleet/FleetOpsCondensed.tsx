import React, { useState } from 'react';
import { 
  BellRing, 
  CalendarClock, 
  Wrench, 
  Camera, 
  Gauge, 
  DollarSign,
  Users,
  ClipboardList,
  MapPin,
  Truck,
  BarChart3,
  CheckCircle,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EnhancedCard, CardContent } from '@/components/ui/enhanced-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const FleetOpsCondensed: React.FC = () => {
  const [operationsExpanded, setOperationsExpanded] = useState(true);
  const [fuelExpanded, setFuelExpanded] = useState(true);
  const [complianceExpanded, setComplianceExpanded] = useState(true);

  return (
    <div className="space-y-8">
      {/* Fleet Operations Card */}
      <EnhancedCard variant="elevated" className="p-6">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Fleet Operations */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Truck className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Fleet Operations</h3>
                  <p className="text-muted-foreground">Keep vehicles and drivers running smoothly.</p>
                </div>
              </div>

              {/* Maintenance & Scheduling */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BellRing className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Maintenance & Scheduling</span>
                </div>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-3">
                    <BellRing className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Alerts, drag-and-drop scheduling, automated work orders</span>
                  </li>
                </ul>
              </div>

              {/* Driver Assignments */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Driver Assignments</span>
                </div>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Shift board, handoff notes, mobile routes</span>
                  </li>
                </ul>
              </div>

              {/* Truck Stock Management */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Truck Stock Management</span>
                </div>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-3">
                    <BarChart3 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Inventory tracking, service readiness, route vs. stock comparison</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Screenshots */}
            <div className="space-y-4">
              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/9d80fc9b-a26b-4daa-92af-1c965d64ff86.png" 
                  alt="Maintenance notifications showing past due and due this week tasks" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">Maintenance Alerts</div>
                </div>
              </EnhancedCard>

              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/0b7accb8-59a2-4da2-9dc3-788ae3549efe.png" 
                  alt="Vehicle selection interface showing fleet vehicles with license plates, makes, models, and availability status" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">Vehicle Selection</div>
                </div>
              </EnhancedCard>

              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/b7bba73c-5402-4e55-8417-455d18cb3338.png" 
                  alt="Truck Stock Management interface" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">Stock Management</div>
                </div>
              </EnhancedCard>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Fuel & Cost Control Card */}
      <EnhancedCard variant="elevated" className="p-6">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Fuel & Cost Control */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Gauge className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Fuel & Cost Control</h3>
                  <p className="text-muted-foreground">Track spend and efficiency across the fleet.</p>
                </div>
              </div>

              {/* Fuel Management */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Fuel Management</span>
                </div>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-3">
                    <Camera className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Receipt photos, MPG by route/vehicle, budget vs. actual trends</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Screenshot */}
            <div className="space-y-4">
              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/a133d807-54c7-49e6-a9b3-a5fd12dbda2c.png" 
                  alt="Fuel management dashboard showing total gallons, costs, and fleet MPG metrics" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">Fuel Tracking</div>
                </div>
              </EnhancedCard>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Compliance & Inspections Card */}
      <EnhancedCard variant="elevated" className="p-6">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Compliance & Inspections */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Compliance & Inspections</h3>
                  <p className="text-muted-foreground">Stay audit-ready and prevent downtime.</p>
                </div>
              </div>

              {/* Transport & Spill Compliance */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Transport & Spill Compliance</span>
                </div>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Manifests, incident logs, expiry reminders</span>
                  </li>
                </ul>
              </div>

              {/* DVIRs & Fleet Maintenance */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">DVIRs & Fleet Maintenance</span>
                </div>
                <ul className="space-y-2 ml-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Pre/post trip checklists, photo documentation, maintenance logs</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column - Screenshots */}
            <div className="space-y-4">
              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/765a797c-a357-42cd-922e-92fb794966bd.png" 
                  alt="Transport & Spill Compliance dashboard" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">Compliance Dashboard</div>
                </div>
              </EnhancedCard>

              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/c021b264-552c-4a3e-b4c3-fcc1d6163147.png" 
                  alt="DVIR form interface" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">DVIR Forms</div>
                </div>
              </EnhancedCard>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  );
};