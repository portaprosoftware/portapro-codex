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
    <div className="space-y-8">
      {/* Top Row: Maintenance & Fuel KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Maintenance Alerts */}
        <EnhancedCard variant="elevated" padding="sm" className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BellRing className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Past Due</span>
                </div>
                <div className="text-2xl font-bold text-red-800">2</div>
                <div className="text-xs text-red-600">Maintenance items</div>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        {/* Upcoming Maintenance */}
        <EnhancedCard variant="elevated" padding="sm" className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CalendarClock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Due This Week</span>
                </div>
                <div className="text-2xl font-bold text-orange-800">5</div>
                <div className="text-xs text-orange-600">Services scheduled</div>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        {/* Fuel Usage */}
        <EnhancedCard variant="elevated" padding="sm" className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Monthly Usage</span>
                </div>
                <div className="text-2xl font-bold text-green-800">695.3</div>
                <div className="text-xs text-green-600">Gallons</div>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        {/* Fuel Spend */}
        <EnhancedCard variant="elevated" padding="sm" className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Monthly Spend</span>
                </div>
                <div className="text-2xl font-bold text-emerald-800">$2,847</div>
                <div className="text-xs text-emerald-600">8% under budget</div>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Screenshots Row: Maintenance & Fuel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-600" />
            Maintenance Notifications & Scheduling
          </h3>
          <img 
            src="/lovable-uploads/9d80fc9b-a26b-4daa-92af-1c965d64ff86.png" 
            alt="Maintenance notifications showing past due and due this week tasks" 
            className="w-full h-auto rounded-lg border shadow-sm" 
          />
          <div className="text-sm text-muted-foreground">
            Threshold-based alerts, drag-and-drop scheduling, auto-generated work orders
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Gauge className="w-5 h-5 text-green-600" />
            Fuel Logs & Cost Tracking
          </h3>
          <img 
            src="/lovable-uploads/a133d807-54c7-49e6-a9b3-a5fd12dbda2c.png" 
            alt="Fuel management dashboard showing total gallons, costs, and fleet MPG metrics" 
            className="w-full h-auto rounded-lg border shadow-sm" 
          />
          <div className="text-sm text-muted-foreground">
            Receipt photos, MPG tracking, budget vs actual with trends
          </div>
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
            className="w-full h-auto rounded-lg border shadow-sm" 
          />
          <div className="text-sm text-muted-foreground">
            Drag-and-drop dispatch, pre-trip checklists, route syncing to mobile
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            Truck Stock Management
          </h3>
          <img 
            src="/lovable-uploads/b7bba73c-5402-4e55-8417-455d18cb3338.png" 
            alt="Truck Stock Management interface showing vehicle selection dropdown and Route vs Truck Stock comparison with service date picker" 
            className="w-full h-auto rounded-lg border shadow-sm" 
          />
          <div className="text-sm text-muted-foreground">
            Vehicle selection, inventory tracking, stock readiness validation
          </div>
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
                className="w-full h-auto rounded-lg border shadow-sm" 
              />
              <div className="text-sm text-muted-foreground">
                Transport manifests, spill incidents, auto reminders for expiring documents
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                DVIRs & Maintenance
              </h4>
              <img 
                src="/lovable-uploads/c021b264-552c-4a3e-b4c3-fcc1d6163147.png" 
                alt="New DVIR form interface showing asset type selection, vehicle details, and defect reporting for fleet maintenance" 
                className="w-full h-auto rounded-lg border shadow-sm" 
              />
              <div className="text-sm text-muted-foreground">
                Pre/Post-trip DVIRs, maintenance logs, driver photos and signatures
              </div>
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