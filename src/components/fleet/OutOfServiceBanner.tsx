import React from 'react';
import { AlertTriangle, Wrench, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WorkOrder } from './work-orders/types';

interface OutOfServiceBannerProps {
  vehicleId: string;
  vehicleName: string;
  onViewWorkOrders?: () => void;
}

export const OutOfServiceBanner: React.FC<OutOfServiceBannerProps> = ({
  vehicleId,
  vehicleName,
  onViewWorkOrders,
}) => {
  // Fetch open work orders for this vehicle
  const { data: openWorkOrders, isLoading } = useQuery({
    queryKey: ['vehicle-oos-work-orders', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('asset_id', vehicleId)
        .eq('asset_type', 'vehicle')
        .in('status', ['open', 'in_progress', 'awaiting_parts'])
        .eq('out_of_service', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as WorkOrder[];
    },
    enabled: !!vehicleId,
  });

  if (isLoading) {
    return null;
  }

  if (!openWorkOrders || openWorkOrders.length === 0) {
    return null;
  }

  const criticalWorkOrders = openWorkOrders.filter(wo => wo.priority === 'critical');
  const highPriorityWorkOrders = openWorkOrders.filter(wo => wo.priority === 'high');

  return (
    <Alert className="mb-4 border-2 border-red-500 bg-red-50">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <AlertDescription className="ml-2">
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-bold text-red-900 text-lg flex items-center gap-2">
              <span>⚠️ Vehicle Out of Service</span>
            </p>
            <p className="text-red-800 mt-1">
              <strong>{vehicleName}</strong> is currently unavailable for assignments due to active maintenance work orders.
            </p>
          </div>

          <div className="space-y-2">
            {criticalWorkOrders.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="destructive" className="font-bold">
                  CRITICAL
                </Badge>
                <span className="text-red-900 font-semibold">
                  {criticalWorkOrders.length} critical work order{criticalWorkOrders.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {highPriorityWorkOrders.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-orange-500 text-white font-bold">
                  HIGH
                </Badge>
                <span className="text-red-800">
                  {highPriorityWorkOrders.length} high priority work order{highPriorityWorkOrders.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {openWorkOrders.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-red-900">Active Work Orders:</p>
                {openWorkOrders.slice(0, 3).map((wo) => (
                  <div key={wo.id} className="flex items-start gap-2 text-sm bg-white/50 rounded p-2">
                    <Wrench className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">
                        {wo.work_order_number} - {wo.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-red-700">
                        <span className="flex items-center gap-1">
                          <Badge variant={wo.priority === 'critical' ? 'destructive' : 'default'} className="text-xs">
                            {wo.priority}
                          </Badge>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Opened: {format(new Date(wo.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {openWorkOrders.length > 3 && (
                  <p className="text-xs text-red-700 italic">
                    + {openWorkOrders.length - 3} more work order{openWorkOrders.length - 3 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {onViewWorkOrders && (
            <Button
              onClick={onViewWorkOrders}
              variant="destructive"
              size="sm"
              className="mt-2 w-full sm:w-auto"
            >
              <Wrench className="h-4 w-4 mr-2" />
              View All Work Orders
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
