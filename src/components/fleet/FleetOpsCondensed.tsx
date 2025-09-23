import React, { useState } from 'react';
import { 
  Truck, 
  Gauge, 
  CheckCircle,
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
      {/* Operations & Scheduling Card */}
      <EnhancedCard variant="elevated" className="p-6">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Features */}
            <div className="lg:col-span-2">
              <Collapsible open={operationsExpanded} onOpenChange={setOperationsExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold text-foreground">Operations & Scheduling</span>
                  </div>
                  {operationsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <ul className="space-y-3 ml-8">
                    <li className="flex items-start gap-3">
                      <span className="text-foreground">Threshold-based alerts: mileage, engine hours, service dates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-foreground">Drag-and-drop scheduling with conflict warnings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-foreground">Auto-generate work orders with parts & labor</span>
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Right Column - Screenshot */}
            <div className="space-y-6">
              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/9d80fc9b-a26b-4daa-92af-1c965d64ff86.png" 
                  alt="Maintenance notifications showing past due and due this week tasks" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">Scheduling Calendar</div>
                  <div className="text-xs text-muted-foreground">Work order management</div>
                </div>
              </EnhancedCard>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Fuel & Costs Card */}
      <EnhancedCard variant="elevated" className="p-6">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Features */}
            <div className="lg:col-span-2">
              <Collapsible open={fuelExpanded} onOpenChange={setFuelExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold text-foreground">Fuel & Costs</span>
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
                      <span className="text-foreground">Receipt photos with automatic data capture</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-foreground">MPG by vehicle and route to spot inefficiencies</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-foreground">Budget vs actual costs with visual trendlines</span>
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Right Column - Screenshot */}
            <div className="space-y-6">
              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/a133d807-54c7-49e6-a9b3-a5fd12dbda2c.png" 
                  alt="Fuel management dashboard showing total gallons, costs, and fleet MPG metrics" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">Fuel Dashboard</div>
                  <div className="text-xs text-muted-foreground">Cost & efficiency tracking</div>
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
            {/* Left Column - Features */}
            <div className="lg:col-span-2">
              <Collapsible open={complianceExpanded} onOpenChange={setComplianceExpanded}>
                <CollapsibleTrigger className="flex items-center justify-between w-full group">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-lg font-semibold text-foreground">Compliance & Inspections</span>
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
                      <span className="text-foreground">Transport manifests, spill logs, auto-expiry reminders</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-foreground">Pre/Post trip DVIR checklists with photos & signatures</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-foreground">Maintenance logs and compliance history</span>
                    </li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Right Column - Screenshot */}
            <div className="space-y-6">
              <EnhancedCard variant="outlined" className="p-4">
                <img 
                  src="/lovable-uploads/765a797c-a357-42cd-922e-92fb794966bd.png" 
                  alt="Transport & Spill Compliance dashboard showing document status alerts for overdue, critical, and warning items" 
                  className="w-full h-auto rounded-lg" 
                />
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-foreground">Compliance Dashboard</div>
                  <div className="text-xs text-muted-foreground">DVIR & document tracking</div>
                </div>
              </EnhancedCard>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>
    </div>
  );
};