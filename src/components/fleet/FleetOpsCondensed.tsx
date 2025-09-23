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

      {/* Middle Row: Driver & Truck Management (Split Card) */}
      <EnhancedCard variant="elevated">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Driver Assignments */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-foreground">Driver Assignments</h3>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900">John Smith</div>
                      <div className="text-sm text-blue-700">Truck #204 • Route A-12</div>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Mike Johnson</div>
                      <div className="text-sm text-gray-700">Available for assignment</div>
                    </div>
                    <Badge variant="outline" className="bg-gray-100">Available</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ClipboardList className="w-4 h-4" />
                  <span>Pre-trip checklists</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>Route syncing</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-border"></div>

            {/* Right: Truck Stock Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-foreground">Truck Stock Readiness</h3>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-purple-900">Truck #204</div>
                      <div className="text-sm text-purple-700">12 units • Ready for service</div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Ready</Badge>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-yellow-900">Truck #187</div>
                      <div className="text-sm text-yellow-700">8 units • Needs restocking</div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Restock</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>Inventory tracking</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Service planning</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </EnhancedCard>

      {/* Bottom Row: Compliance & DVIRs (Single Card) */}
      <EnhancedCard variant="elevated">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
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

          <Collapsible open={complianceExpanded} onOpenChange={setComplianceExpanded}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              
              {/* Transport & Spill Compliance */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Transport & Spill Compliance
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                    <span className="text-red-800">Hazmat Certificate</span>
                    <Badge variant="destructive" className="text-xs">Overdue</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                    <span className="text-yellow-800">Spill Kit Inspection</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Due Soon</Badge>
                  </div>
                </div>
              </div>

              {/* DVIR & Maintenance */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-600" />
                  DVIRs & Maintenance
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-green-800">Pre-trip DVIRs Today</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                    <span className="text-orange-800">Pending Signatures</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">3 Items</Badge>
                  </div>
                </div>
              </div>
            </div>

            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {complianceExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show less details
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  View detailed compliance status
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