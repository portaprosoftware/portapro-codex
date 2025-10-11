import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, ExternalLink, Plus, Calendar, DollarSign, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface VehicleMaintenanceSummaryProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleMaintenanceSummary({ 
  vehicleId, 
  licensePlate 
}: VehicleMaintenanceSummaryProps) {
  const navigate = useNavigate();

  // Fetch all maintenance logs (work orders + maintenance records)
  const { data: maintenanceLogs, isLoading } = useQuery({
    queryKey: ['vehicle-all-maintenance', vehicleId],
    queryFn: async () => {
      // Fetch work orders
      const { data: workOrders, error: woError } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', vehicleId)
        .eq('asset_type', 'vehicle')
        .order('created_at', { ascending: false })
        .limit(10);

      if (woError) throw woError;

      // Fetch maintenance records
      const { data: maintenanceRecords, error: mrError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (mrError) throw mrError;

      // Combine and sort by date
      const combined = [
        ...(workOrders || []).map(wo => ({
          id: wo.id,
          type: 'work_order' as const,
          title: wo.description?.substring(0, 50) || `Work Order ${wo.id.substring(0, 8)}`,
          description: wo.description,
          status: wo.status,
          created_at: wo.created_at,
          completed_at: wo.closed_at,
          cost: wo.total_cost,
          priority: wo.priority
        })),
        ...(maintenanceRecords || []).map(mr => ({
          id: mr.id,
          type: 'maintenance_record' as const,
          title: mr.description?.substring(0, 50) || `Maintenance ${mr.id.substring(0, 8)}`,
          description: mr.description,
          status: mr.status,
          created_at: mr.created_at,
          completed_at: mr.completed_date,
          cost: mr.total_cost,
          priority: mr.priority
        }))
      ].sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

      return combined.slice(0, 10);
    },
    enabled: !!vehicleId
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: 'default' as const, className: 'bg-blue-100 text-blue-700 font-bold' },
      in_progress: { variant: 'default' as const, className: 'bg-yellow-100 text-yellow-700 font-bold' },
      completed: { variant: 'default' as const, className: 'bg-green-100 text-green-700 font-bold' },
      cancelled: { variant: 'outline' as const, className: 'font-bold' },
      scheduled: { variant: 'default' as const, className: 'bg-purple-100 text-purple-700 font-bold' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, className: '' };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          Maintenance Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : maintenanceLogs && maintenanceLogs.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {maintenanceLogs.map((log) => (
              <div
                key={`${log.type}-${log.id}`}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (log.type === 'work_order') {
                    navigate(`/fleet/maintenance?tab=work-orders&vehicle=${vehicleId}&returnTo=/fleet-management`);
                  } else {
                    navigate(`/fleet/maintenance?tab=all-records&vehicle=${vehicleId}&returnTo=/fleet-management`);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{log.title}</h4>
                    {log.description && (
                      <p className="text-xs text-muted-foreground truncate">{log.description}</p>
                    )}
                  </div>
                  {getStatusBadge(log.status)}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(log.created_at || ''), 'MMM d, yyyy')}
                  </div>
                  
                  {log.cost && (
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign className="h-3 w-3" />
                      {log.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                  
                  {log.completed_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Completed {format(new Date(log.completed_at), 'MMM d')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No maintenance records found</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/maintenance?tab=all-records&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            View All <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/fleet/maintenance?tab=work-orders&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          >
            <Plus className="w-3 h-3 mr-1" /> New Work Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
