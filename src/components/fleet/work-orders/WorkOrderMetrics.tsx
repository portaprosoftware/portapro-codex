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
      // Get metrics directly from work_orders table
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('status, created_at, due_date, total_cost');
      
      if (!workOrders) return { open: 0, awaiting_parts: 0, overdue: 0, average_age_days: 0, mtd_cost: 0 };
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const open = workOrders.filter(wo => wo.status === 'open').length;
      const awaiting_parts = workOrders.filter(wo => wo.status === 'awaiting_parts').length;
      const overdue = workOrders.filter(wo => wo.due_date && new Date(wo.due_date) < now).length;
      
      const openOrders = workOrders.filter(wo => wo.status !== 'completed' && wo.status !== 'canceled');
      const average_age_days = openOrders.length > 0 
        ? openOrders.reduce((sum, wo) => sum + Math.floor((now.getTime() - new Date(wo.created_at).getTime()) / (1000 * 60 * 60 * 24)), 0) / openOrders.length
        : 0;
      
      const mtdOrders = workOrders.filter(wo => new Date(wo.created_at) >= monthStart);
      const mtd_cost = mtdOrders.reduce((sum, wo) => sum + (wo.total_cost || 0), 0);
      
      return { open, awaiting_parts, overdue, average_age_days: Math.round(average_age_days), mtd_cost };
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