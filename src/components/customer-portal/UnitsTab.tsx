import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getStatusBadgeVariant } from '@/lib/statusBadgeUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Package,
  Move,
  Wrench,
  FileText,
  Grid3X3,
  Map as MapIcon,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UnitsTabProps {
  customerId: string;
}

export const UnitsTab: React.FC<UnitsTabProps> = ({ customerId }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  // Fetch units data from equipment assignments and product items
  const { data: unitsData = [], isLoading } = useQuery({
    queryKey: ['customer-units', customerId],
    queryFn: async () => {
      // Get equipment assignments for this customer
      const { data: assignments, error: assignmentsError } = await supabase
        .from('equipment_assignments')
        .select(`
          *,
          job:jobs(customer_id, job_type, scheduled_date, status, actual_completion_time),
          product_item:product_items(
            id,
            item_code,
            status,
            condition,
            last_known_location,
            product:products(name)
          )
        `)
        .eq('jobs.customer_id', customerId)
        .eq('status', 'in_service');

      if (assignmentsError) throw assignmentsError;

      // Get service locations
      const { data: locations, error: locationsError } = await supabase
        .from('customer_service_locations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true);

      if (locationsError) throw locationsError;

      // Mock enhanced unit data with service history
      const enhancedUnits = assignments?.map(assignment => ({
        id: assignment.product_item?.id || assignment.id,
        unitCode: assignment.product_item?.item_code || `UNIT-${assignment.id.slice(0, 8)}`,
        type: assignment.product_item?.product?.name || 'Portable Toilet',
        category: 'standard',
        status: assignment.product_item?.status || 'in_service',
        condition: assignment.product_item?.condition || 'good',
        location: locations?.find(l => l.id === assignment.job?.customer_id) || locations?.[0],
        lastCleaned: assignment.job?.actual_completion_time || assignment.job?.scheduled_date,
        nextDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'Weekly',
        assignedDate: assignment.assigned_date,
        specialInstructions: ['Gate code: 1234', 'Behind main building'],
        hazardFlags: assignment.product_item?.condition === 'needs_repair' ? ['Maintenance Required'] : [],
        serviceHistory: [
          {
            date: assignment.job?.actual_completion_time || assignment.job?.scheduled_date,
            type: assignment.job?.job_type || 'service',
            technician: 'John Smith',
            notes: 'Regular maintenance completed'
          }
        ]
      })) || [];

      return enhancedUnits;
    },
    enabled: !!customerId,
  });


  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'needs_repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Units Management</h3>
          <p className="text-sm text-muted-foreground">
            Track your units, service history, and locations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Grid View
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="gap-2"
          >
            <MapIcon className="h-4 w-4" />
            Map View
          </Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unitsData.map((unit) => (
            <Card key={unit.id} className="customer-portal-card border-0 shadow-none hover:transform hover:-translate-y-1 transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{unit.unitCode}</CardTitle>
                  </div>
                  <Badge variant={getStatusBadgeVariant(unit.status as any)}>
                    {unit.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{unit.type}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Location */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{unit.location?.location_name || 'Unknown Location'}</span>
                </div>

                {/* Service Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Last cleaned: {unit.lastCleaned ? format(new Date(unit.lastCleaned), 'MMM dd') : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Next due: {format(new Date(unit.nextDue), 'MMM dd')}</span>
                  </div>
                </div>

                {/* Condition */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Condition:</span>
                  <Badge className={cn("text-xs", getConditionColor(unit.condition))}>
                    {unit.condition.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Hazard Flags */}
                {unit.hazardFlags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-700">{unit.hazardFlags[0]}</span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Move className="h-3 w-3" />
                        Move
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Unit Move</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">
                        Feature coming soon - Request to move {unit.unitCode} to a new location
                      </p>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Wrench className="h-3 w-3" />
                        Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Extra Service</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">
                        Feature coming soon - Schedule additional service for {unit.unitCode}
                      </p>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedUnit(unit)}
                        className="gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Unit Details - {unit.unitCode}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Type</label>
                            <p className="text-sm text-muted-foreground">{unit.type}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <p className="text-sm text-muted-foreground">{unit.status}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Condition</label>
                            <p className="text-sm text-muted-foreground">{unit.condition}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Frequency</label>
                            <p className="text-sm text-muted-foreground">{unit.frequency}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Special Instructions</label>
                          <ul className="text-sm text-muted-foreground mt-1">
                            {unit.specialInstructions.map((instruction, idx) => (
                              <li key={idx}>• {instruction}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Recent Service History</label>
                          <div className="mt-2 space-y-2">
                            {unit.serviceHistory.map((service, idx) => (
                              <div key={idx} className="border rounded p-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium">{service.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {service.date ? format(new Date(service.date), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{service.technician}</p>
                                </div>
                                <p className="text-sm mt-1">{service.notes}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="h-96">
          <CardContent className="h-full flex items-center justify-center">
            <div className="text-center">
              <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Interactive Map View</h3>
              <p className="text-muted-foreground mb-4">
                View all your units on an interactive map with real-time status indicators
              </p>
              <p className="text-sm text-muted-foreground">
                Map integration coming soon - will show GPS locations from customer_service_locations
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};