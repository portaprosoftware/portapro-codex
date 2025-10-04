import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DVIRDefectBadgeProps {
  dvirId: string;
  onWorkOrderClick?: (workOrderId: string) => void;
}

export const DVIRDefectBadge: React.FC<DVIRDefectBadgeProps> = ({ 
  dvirId, 
  onWorkOrderClick 
}) => {
  // Check if work orders exist for this DVIR's defects
  const { data: workOrders } = useQuery({
    queryKey: ['dvir-work-orders', dvirId],
    queryFn: async () => {
      // Get defects for this DVIR
      const { data: defects, error: defectsError } = await supabase
        .from('dvir_defects')
        .select('id')
        .eq('dvir_id', dvirId);
      
      if (defectsError) throw defectsError;
      if (!defects || defects.length === 0) return [];

      const defectIds = defects.map(d => d.id);

      // Find work orders created from these defects
      const { data: workOrders, error: woError } = await supabase
        .from('work_orders' as any)
        .select('id, work_order_number, status')
        .eq('source', 'dvir_defect')
        .in('id', defectIds); // This assumes source_id links to defect
      
      if (woError) throw woError;
      return workOrders || [];
    }
  });

  if (!workOrders || workOrders.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {workOrders.map((wo: any) => (
        <Badge 
          key={wo.id}
          variant={wo.status === 'completed' ? 'outline' : 'default'}
          className="cursor-pointer hover:bg-primary/90 transition-colors"
          onClick={() => onWorkOrderClick?.(wo.id)}
        >
          <Wrench className="h-3 w-3 mr-1" />
          {wo.work_order_number}
          <ExternalLink className="h-2 w-2 ml-1" />
        </Badge>
      ))}
    </div>
  );
};
