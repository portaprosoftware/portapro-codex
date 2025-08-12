import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/ui/StatCard";
import { AlertTriangle, Clock, Package, DollarSign } from "lucide-react";

interface WorkOrderMetrics {
  open: number;
  awaiting_parts: number;
  overdue: number;
  average_age_days: number;
  mtd_cost: number;
}

export const WorkOrderMetrics: React.FC = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["work-order-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_work_order_metrics");
      if (error) throw error;
      return data as WorkOrderMetrics;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Open"
        value={metrics?.open || 0}
        icon={AlertTriangle}
        gradientFrom="hsl(var(--destructive))"
        gradientTo="hsl(var(--destructive))"
        iconBg="hsl(var(--destructive))"
        animateValue={!isLoading}
      />
      <StatCard
        title="Awaiting Parts"
        value={metrics?.awaiting_parts || 0}
        icon={Package}
        gradientFrom="hsl(var(--warning))"
        gradientTo="hsl(var(--warning))"
        iconBg="hsl(var(--warning))"
        animateValue={!isLoading}
      />
      <StatCard
        title="Overdue"
        value={metrics?.overdue || 0}
        icon={Clock}
        gradientFrom="hsl(var(--destructive))"
        gradientTo="hsl(var(--destructive))"
        iconBg="hsl(var(--destructive))"
        animateValue={!isLoading}
      />
      <StatCard
        title="Avg Age"
        value={`${metrics?.average_age_days || 0}d`}
        icon={Clock}
        gradientFrom="hsl(var(--muted))"
        gradientTo="hsl(var(--muted))"
        iconBg="hsl(var(--muted))"
        animateValue={!isLoading}
      />
      <StatCard
        title="MTD Cost"
        value={`$${(metrics?.mtd_cost || 0).toLocaleString()}`}
        icon={DollarSign}
        gradientFrom="hsl(var(--primary))"
        gradientTo="hsl(var(--primary))"
        iconBg="hsl(var(--primary))"
        animateValue={!isLoading}
      />
    </div>
  );
};