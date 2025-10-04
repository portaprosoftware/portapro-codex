import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wrench, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface OpenWorkOrdersWidgetProps {
  vehicleId: string;
  onWorkOrderClick?: (workOrderId: string) => void;
}

export const OpenWorkOrdersWidget: React.FC<OpenWorkOrdersWidgetProps> = ({
  vehicleId,
  onWorkOrderClick
}) => {
  const { data: workOrders, isLoading } = useQuery({
    queryKey: ['vehicle-open-work-orders', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders' as any)
        .select('*')
        .eq('asset_id', vehicleId)
        .in('status', ['open', 'in_progress'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'normal': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical') return <AlertCircle className="h-3 w-3" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Open Work Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Open Work Orders
          </CardTitle>
          {workOrders && workOrders.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {workOrders.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!workOrders || workOrders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No open work orders</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              {workOrders.map((wo: any) => (
                <div
                  key={wo.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onWorkOrderClick?.(wo.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {wo.work_order_number}
                        </span>
                        <Badge 
                          variant={getPriorityColor(wo.priority) as any} 
                          className="text-xs flex items-center gap-1"
                        >
                          {getPriorityIcon(wo.priority)}
                          {wo.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {wo.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(wo.created_at), { addSuffix: true })}</span>
                    </div>
                    {wo.due_date && (
                      <div className="flex items-center gap-1">
                        <span>Due: {new Date(wo.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {wo.out_of_service && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="text-xs">
                        Vehicle Out of Service
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
