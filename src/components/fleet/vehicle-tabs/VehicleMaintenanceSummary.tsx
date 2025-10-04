import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, ExternalLink, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { VehicleSummaryData } from '@/hooks/vehicle/useVehicleSummary';

interface VehicleMaintenanceSummaryProps {
  summary: VehicleSummaryData['maintenance'] | undefined;
  vehicleId: string;
  licensePlate: string;
}

export function VehicleMaintenanceSummary({ 
  summary, 
  vehicleId, 
  licensePlate 
}: VehicleMaintenanceSummaryProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          Maintenance Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Open Work Orders:</span>
            <span className="font-semibold">{summary?.open_work_orders ?? 0}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">DVIRs (Last 30 Days):</span>
            <span className="font-semibold">{summary?.dvirs_30d ?? 0}</span>
          </div>

          {summary?.next_pm_due && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next PM Due:</span>
              <span className="font-semibold text-orange-600">
                {summary.next_pm_due.name} ({summary.next_pm_due.due_value} {summary.next_pm_due.trigger_type})
              </span>
            </div>
          )}

          {summary?.last_dvir && (
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Last DVIR:</span>
              <div className="flex items-center gap-2">
                {summary.last_dvir.status === 'pass' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="font-semibold capitalize">
                  {summary.last_dvir.status} ({format(new Date(summary.last_dvir.date), 'MMM d')})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/maintenance?vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            View All <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/maintenance/work-orders/new?vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            <Plus className="w-3 h-3 mr-1" /> New Work Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
