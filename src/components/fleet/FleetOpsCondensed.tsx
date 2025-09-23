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
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { EnhancedCard, CardContent } from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const FleetOpsCondensed: React.FC = () => {
  const [complianceExpanded, setComplianceExpanded] = useState(false);

  return (
    <div className="space-y-8">{/* Screenshots Row: Maintenance & Fuel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-600" />
            Maintenance Notifications & Scheduling
          </h3>
          <img 
            src="/lovable-uploads/9d80fc9b-a26b-4daa-92af-1c965d64ff86.png" 
            alt="Maintenance notifications showing past due and due this week tasks" 
            className="w-full h-auto rounded-lg" 
          />
          
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
              Never miss a service with automated alerts and a clean calendar view
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-3">
                  <BellRing className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Threshold-based alerts: mileage, engine hours, dates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CalendarClock className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Drag-and-drop scheduling with conflict warnings</span>
                </li>
                <li className="flex items-start gap-3">
                  <Wrench className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Auto-generate work orders with parts and labor</span>
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Gauge className="w-5 h-5 text-green-600" />
            Fuel Logs & Cost Tracking
          </h3>
          <img 
            src="/lovable-uploads/a133d807-54c7-49e6-a9b3-a5fd12dbda2c.png" 
            alt="Fuel management dashboard showing total gallons, costs, and fleet MPG metrics" 
            className="w-full h-auto rounded-lg" 
          />
          
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
              Understand spend, MPG, and trends across the fleet
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-3">
                  <Camera className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Receipt photos with automatic data capture</span>
                </li>
                <li className="flex items-start gap-3">
                  <Gauge className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">MPG by vehicle and route—spot outliers fast</span>
                </li>
                <li className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Monthly budget vs actual with trendlines</span>
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Middle Row: Driver & Truck Management Screenshots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Driver Assignments
          </h3>
          <img 
            src="/lovable-uploads/0b7accb8-59a2-4da2-9dc3-788ae3549efe.png" 
            alt="Vehicle selection interface showing fleet vehicles with license plates, makes, models, and availability status" 
            className="w-full h-auto rounded-lg" 
          />
          
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
              Simple, clear dispatch—drivers know exactly where to go
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Drag-and-drop shift board with availability</span>
                </li>
                <li className="flex items-start gap-3">
                  <ClipboardList className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Pre-trip checklists and handoff notes</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Routes and stops synced to the mobile app</span>
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            Truck Stock Management
          </h3>
          <img 
            src="/lovable-uploads/b7bba73c-5402-4e55-8417-455d18cb3338.png" 
            alt="Truck Stock Management interface showing vehicle selection dropdown and Route vs Truck Stock comparison with service date picker" 
            className="w-full h-auto rounded-lg" 
          />
          
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
              Optimize vehicle loading and track real-time inventory across your fleet
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Vehicle selection and inventory tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart3 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Route vs truck stock comparison</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Stock readiness validation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Service date planning</span>
                </li>
                <li className="flex items-start gap-3">
                  <Gauge className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Real-time inventory status</span>
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Bottom Row: Compliance & DVIRs Screenshots */}
      <EnhancedCard variant="elevated">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-foreground">Compliance & Inspections</h3>
            </div>
            <div className="flex gap-2">
              <Badge variant="destructive">2 Overdue</Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">3 Critical</Badge>
              <Badge variant="outline">5 Warning</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Transport & Spill Compliance
              </h4>
              <img 
                src="/lovable-uploads/765a797c-a357-42cd-922e-92fb794966bd.png" 
                alt="Transport & Spill Compliance dashboard showing document status alerts for overdue, critical, and warning items" 
                className="w-full h-auto rounded-lg" 
              />
              
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="w-4 h-4" />
                  Stay audit-ready with structured logs and document tracking
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Transport manifests & chain-of-custody</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Spill incidents with photos, notes, and follow-ups</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Auto reminders for expiring documents</span>
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                DVIRs & Maintenance
              </h4>
              <img 
                src="/lovable-uploads/c021b264-552c-4a3e-b4c3-fcc1d6163147.png" 
                alt="New DVIR form interface showing asset type selection, vehicle details, and defect reporting for fleet maintenance" 
                className="w-full h-auto rounded-lg" 
              />
              
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="w-4 h-4" />
                  Pre/Post-trip inspections with digital documentation
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Pre/Post-trip DVIR checklists</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Maintenance logs and alerts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Driver photos and signatures</span>
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          <Collapsible open={complianceExpanded} onOpenChange={setComplianceExpanded}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {complianceExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show less compliance details
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  View detailed compliance metrics
                </>
              )}
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">24</div>
                  <div className="text-sm text-muted-foreground">Completed DVIRs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">3</div>
                  <div className="text-sm text-muted-foreground">Pending Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-muted-foreground">Compliance Rate</div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </EnhancedCard>
    </div>
  );
};