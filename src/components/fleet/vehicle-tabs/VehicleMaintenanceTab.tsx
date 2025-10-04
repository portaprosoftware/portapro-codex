import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVehicleWorkOrders } from '@/hooks/vehicle/useVehicleWorkOrders';
import { useVehicleDVIRs } from '@/hooks/vehicle/useVehicleDVIRs';
import { Wrench, Plus, ExternalLink, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { DVIRFormModal } from '@/components/fleet/DVIRFormModal';

interface VehicleMaintenanceTabProps {
  vehicleId: string;
  licensePlate: string;
  onAddWorkOrder?: () => void;
  onAddDVIR?: () => void;
  isActive?: boolean;
}

export function VehicleMaintenanceTab({ 
  vehicleId, 
  licensePlate,
  onAddWorkOrder,
  onAddDVIR,
  isActive = true
}: VehicleMaintenanceTabProps) {
  const navigate = useNavigate();
  const [isDVIRModalOpen, setIsDVIRModalOpen] = useState(false);
  
  const { data: workOrders, isLoading: workOrdersLoading } = useVehicleWorkOrders({
    vehicleId,
    limit: 5,
    enabled: isActive,
  });

  const { data: dvirs, isLoading: dvirsLoading } = useVehicleDVIRs({
    vehicleId,
    limit: 5,
    enabled: isActive,
  });

  const handleAddDVIR = () => {
    setIsDVIRModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'in_progress':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'cancelled':
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Work Orders */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Work Orders ({workOrders?.total || 0})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAddWorkOrder}>
              <Plus className="w-4 h-4 mr-1" />
              New Work Order
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/fleet/maintenance?vehicle_id=${vehicleId}&vehicle_name=${encodeURIComponent(licensePlate)}`)}
              title="View all work orders"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workOrdersLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : workOrders && workOrders.items.length > 0 ? (
            <div className="space-y-3">
              {workOrders.items.map((wo: any) => (
                <div
                  key={wo.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{wo.asset_name || licensePlate}</p>
                      <Badge className={cn("text-white font-bold", getStatusColor(wo.status))}>
                        {wo.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{wo.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(wo.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {wo.priority === 'high' && (
                    <Badge variant="destructive" className="font-bold">HIGH</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No work orders yet</p>
              <Button size="sm" onClick={onAddWorkOrder}>
                <Plus className="w-4 h-4 mr-1" />
                Create First Work Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DVIRs */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent DVIRs ({dvirs?.total || 0})
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddDVIR}>
              <Plus className="w-4 h-4 mr-1" />
              New DVIR
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/fleet/compliance?tab=dvirs&vehicle_id=${vehicleId}&vehicle_name=${encodeURIComponent(licensePlate)}`)}
              title="View all DVIRs"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {dvirsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : dvirs && dvirs.items.length > 0 ? (
            <div className="space-y-3">
              {dvirs.items.map((dvir: any) => (
                <div
                  key={dvir.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn(
                        "font-bold text-white",
                        dvir.status === 'pass' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                      )}>
                        {dvir.status?.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(dvir.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    {dvir.odometer_reading && (
                      <p className="text-xs text-muted-foreground">
                        Odometer: {dvir.odometer_reading.toLocaleString()} mi
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No DVIRs yet</p>
              <Button size="sm" onClick={handleAddDVIR}>
                <Plus className="w-4 h-4 mr-1" />
                Create First DVIR
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DVIRFormModal
        open={isDVIRModalOpen}
        onOpenChange={setIsDVIRModalOpen}
        preSelectedVehicleId={vehicleId}
      />
    </div>
  );
}
