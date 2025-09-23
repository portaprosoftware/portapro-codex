import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StatCard } from '@/components/ui/StatCard';
import { 
  ChevronDown, 
  ChevronUp,
  Truck, 
  Gauge, 
  Camera, 
  FileText, 
  Users, 
  Shield, 
  Clock, 
  DollarSign, 
  Wrench,
  Droplets
} from 'lucide-react';

export const ConsolidatedFleetCard: React.FC = () => {
  const [trackingOpen, setTrackingOpen] = useState(true);
  const [operationsOpen, setOperationsOpen] = useState(true);

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-left">Complete Fleet Management</CardTitle>
        <p className="text-lg text-muted-foreground text-left">
          Every vehicle has a dedicated "home base" for comprehensive management, compliance tracking, and operational efficiency.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Feature Lists */}
          <div className="space-y-6">
            {/* Vehicle Tracking Section */}
            <Collapsible open={trackingOpen} onOpenChange={setTrackingOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-left">Vehicle Tracking</h3>
                </div>
                {trackingOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 pl-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Vehicle profiles with status, location, and availability</span>
                </div>
                <div className="flex items-start gap-3">
                  <Gauge className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Automatic and manual mileage tracking with history</span>
                </div>
                <div className="flex items-start gap-3">
                  <Camera className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Photo documentation for condition and damage tracking</span>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Document compliance with expiry alerts and insurance tracking</span>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Fleet Operations Section */}
            <Collapsible open={operationsOpen} onOpenChange={setOperationsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-left">Fleet Operations</h3>
                </div>
                {operationsOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 pl-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Daily driver shifts with vehicle handoffs and checklists</span>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">DOCs, registrations, insurance—alerts before anything expires</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Preventive maintenance scheduling with auto work orders</span>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Parts, labor, and vendor cost tracking per vehicle</span>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Right Column - Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-left mb-4">At-a-Glance Metrics</h3>
            <div className="space-y-4">
              <StatCard 
                title="Monthly Fuel Spend" 
                value="$10,932" 
                icon={Droplets} 
                gradientFrom="hsl(38, 90%, 50%)" 
                gradientTo="hsl(38, 90%, 40%)" 
                iconBg="hsl(38, 90%, 50%)" 
                subtitle={<span className="text-muted-foreground">Down 6% vs last month</span>} 
              />
              <StatCard 
                title="Upcoming Services" 
                value={9} 
                icon={Wrench} 
                gradientFrom="hsl(25, 95%, 53%)" 
                gradientTo="hsl(25, 95%, 43%)" 
                iconBg="hsl(25, 95%, 53%)" 
                subtitle={<span className="text-muted-foreground">Due in next 7 days</span>} 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};