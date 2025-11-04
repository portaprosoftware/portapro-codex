import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Wrench, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { getDefaultDueDateForPriority } from "@/lib/workOrderRules";

interface DVIRDefectsListProps {
  dvirId: string;
  assetId: string;
  assetType: "vehicle" | "trailer";
  onWorkOrderCreated?: () => void;
}

export const DVIRDefectsList: React.FC<DVIRDefectsListProps> = ({
  dvirId,
  assetId,
  assetType,
  onWorkOrderCreated
}) => {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Fetch defects for this DVIR
  const { data: defects, isLoading } = useQuery({
    queryKey: ['dvir-defects', dvirId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dvir_defects')
        .select('*')
        .eq('dvir_id', dvirId)
        .order('severity', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Check for existing work orders
  const { data: existingWorkOrders } = useQuery({
    queryKey: ['dvir-defects-work-orders', dvirId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, work_order_number, status, dvir_report_id')
        .eq('dvir_report_id', dvirId);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Create work order mutation
  const createWorkOrderMutation = useMutation({
    mutationFn: async (defect: any) => {
      const priority = defect.severity === 'critical' ? 'critical' : 'high';
      const dueDate = getDefaultDueDateForPriority(priority);

      const payload: any = {
        source: 'dvir_defect',
        asset_id: assetId,
        asset_type: assetType,
        priority: priority,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        description: `DVIR Defect: ${defect.item_key}\n\nSeverity: ${defect.severity}\n\nDetails: ${defect.notes || 'No additional details provided'}`,
        dvir_report_id: dvirId,
        out_of_service: defect.severity === 'critical',
        source_context: 'dvir_auto_generated',
        status: 'open',
        opened_at: new Date().toISOString()
      };

      const { data: workOrder, error } = await supabase
        .from('work_orders')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      // Insert history record
      await supabase.from('work_order_history').insert({
        work_order_id: workOrder.id,
        from_status: null,
        to_status: 'open',
        changed_by: user?.id || 'system',
        note: `Work order created from DVIR defect: ${defect.item_key}`
      });

      // If critical, mark vehicle as out of service
      if (defect.severity === 'critical' && assetType === 'vehicle') {
        await supabase
          .from('vehicles')
          .update({
            out_of_service: true,
            out_of_service_reason: `Critical DVIR defect: ${defect.item_key}`,
            out_of_service_since: new Date().toISOString()
          })
          .eq('id', assetId);
      }

      return workOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dvir-defects-work-orders', dvirId] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-work-orders'] });
      
      toast({
        title: "Work order created",
        description: `${data.work_order_number} created for DVIR defect`
      });

      if (onWorkOrderCreated) {
        onWorkOrderCreated();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create work order",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading defects...</div>;
  }

  if (!defects || defects.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>No defects found for this DVIR</AlertDescription>
      </Alert>
    );
  }

  const getWorkOrderForDefect = (defectId: string) => {
    return existingWorkOrders?.find(wo => wo.dvir_report_id === dvirId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'major':
        return 'default';
      case 'minor':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          DVIR Defects ({defects.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {defects.map((defect: any) => {
          const existingWO = getWorkOrderForDefect(defect.id);
          
          return (
            <div 
              key={defect.id}
              className="border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityColor(defect.severity)}>
                      {defect.severity}
                    </Badge>
                    <span className="text-sm font-medium">{defect.item_key}</span>
                  </div>
                  {defect.notes && (
                    <p className="text-xs text-muted-foreground">{defect.notes}</p>
                  )}
                  {defect.status === 'closed' && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Closed {defect.closed_at && `on ${format(new Date(defect.closed_at), 'MMM d')}`}
                    </Badge>
                  )}
                </div>

                {existingWO ? (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      <Wrench className="h-2 w-2 mr-1" />
                      {existingWO.work_order_number}
                    </Badge>
                  </div>
                ) : (
                  defect.status !== 'closed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createWorkOrderMutation.mutate(defect)}
                      disabled={createWorkOrderMutation.isPending}
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Create WO
                    </Button>
                  )
                )}
              </div>
            </div>
          );
        })}

        {defects.some((d: any) => d.status !== 'closed' && !getWorkOrderForDefect(d.id)) && (
          <Button
            onClick={() => {
              const openDefects = defects.filter((d: any) => d.status !== 'closed' && !getWorkOrderForDefect(d.id));
              openDefects.forEach(defect => createWorkOrderMutation.mutate(defect));
            }}
            disabled={createWorkOrderMutation.isPending}
            className="w-full"
            variant="secondary"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Create Work Orders for All Open Defects
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
