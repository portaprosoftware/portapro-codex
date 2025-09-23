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
  const [maintenanceExpanded, setMaintenanceExpanded] = useState(true);
  const [fuelExpanded, setFuelExpanded] = useState(true);
  const [driversExpanded, setDriversExpanded] = useState(true);
  const [trucksExpanded, setTrucksExpanded] = useState(true);
  const [complianceExpanded, setComplianceExpanded] = useState(true);
  const [dvirExpanded, setDvirExpanded] = useState(true);

  return (
    <EnhancedCard variant="elevated" className="p-6">
      <CardContent className="p-0">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Complete Fleet Management</h2>
          <p className="text-muted-foreground">
            Every vehicle has a dedicated "home base" for comprehensive management, compliance tracking, and operational efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Features */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Maintenance & Scheduling */}
            <Collapsible open={maintenanceExpanded} onOpenChange={setMaintenanceExpanded}>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <BellRing className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-foreground">Maintenance & Scheduling</span>
                </div>
                {maintenanceExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <ul className="space-y-3 ml-8">
                  <li className="flex items-start gap-3">
                    <BellRing className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Threshold-based alerts: mileage, engine hours, dates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CalendarClock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Drag-and-drop scheduling with conflict warnings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Wrench className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Auto-generate work orders with parts and labor</span>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Fuel Management */}
            <Collapsible open={fuelExpanded} onOpenChange={setFuelExpanded}>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-foreground">Fuel Management</span>
                </div>
                {fuelExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <ul className="space-y-3 ml-8">
                  <li className="flex items-start gap-3">
                    <Camera className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Receipt photos with automatic data capture</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Gauge className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">MPG by vehicle and route—spot outliers fast</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <DollarSign className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Monthly budget vs actual with trendlines</span>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Driver Assignments */}
            <Collapsible open={driversExpanded} onOpenChange={setDriversExpanded}>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-foreground">Driver Assignments</span>
                </div>
                {driversExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <ul className="space-y-3 ml-8">
                  <li className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Drag-and-drop shift board with availability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ClipboardList className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Pre-trip checklists and handoff notes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Routes and stops synced to the mobile app</span>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Truck Stock Management */}
            <Collapsible open={trucksExpanded} onOpenChange={setTrucksExpanded}>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-foreground">Truck Stock Management</span>
                </div>
                {trucksExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <ul className="space-y-3 ml-8">
                  <li className="flex items-start gap-3">
                    <Truck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Vehicle selection and inventory tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BarChart3 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Route vs truck stock comparison</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Stock readiness validation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Service date planning</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Gauge className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Real-time inventory status</span>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Transport & Spill Compliance */}
            <Collapsible open={complianceExpanded} onOpenChange={setComplianceExpanded}>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-foreground">Transport & Spill Compliance</span>
                </div>
                {complianceExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <ul className="space-y-3 ml-8">
                  <li className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Transport manifests & chain-of-custody</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Spill incidents with photos, notes, and follow-ups</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BellRing className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Auto reminders for expiring documents</span>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* DVIRs & Fleet Maintenance */}
            <Collapsible open={dvirExpanded} onOpenChange={setDvirExpanded}>
              <CollapsibleTrigger className="flex items-center justify-between w-full group">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold text-foreground">DVIRs & Fleet Maintenance</span>
                </div>
                {dvirExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <ul className="space-y-3 ml-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Pre/Post-trip DVIR checklists</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Wrench className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Maintenance logs and alerts</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Camera className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Driver photos and signatures</span>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Right Column - Screenshots */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground text-center">Software Screenshots</h3>
            
            {/* Maintenance Screenshot */}
            <EnhancedCard variant="outlined" className="p-4">
              <img 
                src="/lovable-uploads/9d80fc9b-a26b-4daa-92af-1c965d64ff86.png" 
                alt="Maintenance notifications showing past due and due this week tasks" 
                className="w-full h-auto rounded-lg" 
              />
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-foreground">Maintenance Alerts</div>
                <div className="text-xs text-muted-foreground">Past due & upcoming</div>
              </div>
            </EnhancedCard>

            {/* Fuel Screenshot */}
            <EnhancedCard variant="outlined" className="p-4">
              <img 
                src="/lovable-uploads/a133d807-54c7-49e6-a9b3-a5fd12dbda2c.png" 
                alt="Fuel management dashboard showing total gallons, costs, and fleet MPG metrics" 
                className="w-full h-auto rounded-lg" 
              />
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-foreground">Fuel Tracking</div>
                <div className="text-xs text-muted-foreground">Usage & costs</div>
              </div>
            </EnhancedCard>

            {/* Driver Assignments Screenshot */}
            <EnhancedCard variant="outlined" className="p-4">
              <img 
                src="/lovable-uploads/0b7accb8-59a2-4da2-9dc3-788ae3549efe.png" 
                alt="Vehicle selection interface showing fleet vehicles with license plates, makes, models, and availability status" 
                className="w-full h-auto rounded-lg" 
              />
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-foreground">Vehicle Selection</div>
                <div className="text-xs text-muted-foreground">Fleet assignment</div>
              </div>
            </EnhancedCard>

            {/* Truck Stock Screenshot */}
            <EnhancedCard variant="outlined" className="p-4">
              <img 
                src="/lovable-uploads/b7bba73c-5402-4e55-8417-455d18cb3338.png" 
                alt="Truck Stock Management interface showing vehicle selection dropdown and Route vs Truck Stock comparison with service date picker" 
                className="w-full h-auto rounded-lg" 
              />
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-foreground">Stock Management</div>
                <div className="text-xs text-muted-foreground">Inventory tracking</div>
              </div>
            </EnhancedCard>

            {/* Compliance Screenshot */}
            <EnhancedCard variant="outlined" className="p-4">
              <img 
                src="/lovable-uploads/765a797c-a357-42cd-922e-92fb794966bd.png" 
                alt="Transport & Spill Compliance dashboard showing document status alerts for overdue, critical, and warning items" 
                className="w-full h-auto rounded-lg" 
              />
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-foreground">Compliance</div>
                <div className="text-xs text-muted-foreground">Document tracking</div>
              </div>
            </EnhancedCard>

            {/* DVIR Screenshot */}
            <EnhancedCard variant="outlined" className="p-4">
              <img 
                src="/lovable-uploads/c021b264-552c-4a3e-b4c3-fcc1d6163147.png" 
                alt="New DVIR form interface showing asset type selection, vehicle details, and defect reporting for fleet maintenance" 
                className="w-full h-auto rounded-lg" 
              />
              <div className="mt-2 text-center">
                <div className="text-sm font-medium text-foreground">DVIR Forms</div>
                <div className="text-xs text-muted-foreground">Vehicle inspections</div>
              </div>
            </EnhancedCard>
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  );
};