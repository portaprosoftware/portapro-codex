import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  DollarSign, 
  Wrench, 
  TrendingUp, 
  Users, 
  Package,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { CompletionTimeChart } from "./CompletionTimeChart";
import { CostBreakdownChart } from "./CostBreakdownChart";
import { IssueFrequencyChart } from "./IssueFrequencyChart";
import { TechnicianPerformanceTable } from "./TechnicianPerformanceTable";
import { PartsUsageChart } from "./PartsUsageChart";
import { format, differenceInHours, differenceInDays } from "date-fns";

export const WorkOrderAnalyticsDashboard: React.FC = () => {
  // Fetch work orders with related data
  const { data: workOrders, isLoading } = useQuery({
    queryKey: ["work-orders-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          *,
          work_order_parts(*),
          work_order_labor(*)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!workOrders || workOrders.length === 0) {
      return {
        avgCompletionTime: 0,
        totalCost: 0,
        completedCount: 0,
        openCount: 0,
        avgCostPerWorkOrder: 0,
        costBreakdown: { parts: 0, labor: 0, external: 0, taxes: 0 },
        issuesByType: {},
        issuesByPriority: {},
        technicianStats: {},
        partsUsage: {},
        completionTimesByMonth: [],
        costsByCategory: []
      };
    }

    const completedOrders = workOrders.filter((wo: any) => wo.status === "completed" && wo.closed_at);
    
    // Average completion time (in hours)
    let totalCompletionTime = 0;
    completedOrders.forEach((wo: any) => {
      if (wo.created_at && wo.closed_at) {
        totalCompletionTime += differenceInHours(new Date(wo.closed_at), new Date(wo.created_at));
      }
    });
    const avgCompletionTime = completedOrders.length > 0 
      ? totalCompletionTime / completedOrders.length 
      : 0;

    // Cost calculations
    let totalPartsCost = 0;
    let totalLaborCost = 0;
    let totalExternalCost = 0;
    let totalTaxesFees = 0;

    workOrders.forEach((wo: any) => {
      // Parts cost
      if (wo.work_order_parts) {
        wo.work_order_parts.forEach((part: any) => {
          totalPartsCost += (part.quantity || 0) * (part.unit_cost || 0);
        });
      }
      
      // Labor cost
      if (wo.work_order_labor) {
        wo.work_order_labor.forEach((labor: any) => {
          totalLaborCost += (labor.hours || 0) * (labor.hourly_rate || 0);
        });
      }

      // External and taxes
      totalExternalCost += wo.external_cost || 0;
      totalTaxesFees += wo.taxes_fees || 0;
    });

    const totalCost = totalPartsCost + totalLaborCost + totalExternalCost + totalTaxesFees;
    const avgCostPerWorkOrder = workOrders.length > 0 ? totalCost / workOrders.length : 0;

    // Issues by source/type
    const issuesByType: Record<string, number> = {};
    const issuesByPriority: Record<string, number> = {};
    
    workOrders.forEach((wo: any) => {
      const source = wo.source || "other";
      issuesByType[source] = (issuesByType[source] || 0) + 1;
      
      const priority = wo.priority || "normal";
      issuesByPriority[priority] = (issuesByPriority[priority] || 0) + 1;
    });

    // Technician performance
    const technicianStats: Record<string, { 
      completed: number; 
      avgTime: number; 
      totalCost: number;
      totalTime: number;
      count: number;
    }> = {};

    completedOrders.forEach((wo: any) => {
      const techId = wo.assigned_to || "Unassigned";
      if (!technicianStats[techId]) {
        technicianStats[techId] = { 
          completed: 0, 
          avgTime: 0, 
          totalCost: 0,
          totalTime: 0,
          count: 0
        };
      }
      
      technicianStats[techId].completed += 1;
      technicianStats[techId].count += 1;
      
      if (wo.created_at && wo.closed_at) {
        const hours = differenceInHours(new Date(wo.closed_at), new Date(wo.created_at));
        technicianStats[techId].totalTime += hours;
      }

      // Calculate cost for this work order
      let woCost = 0;
      if (wo.work_order_parts) {
        wo.work_order_parts.forEach((part: any) => {
          woCost += (part.quantity || 0) * (part.unit_cost || 0);
        });
      }
      if (wo.work_order_labor) {
        wo.work_order_labor.forEach((labor: any) => {
          woCost += (labor.hours || 0) * (labor.hourly_rate || 0);
        });
      }
      woCost += (wo.external_cost || 0) + (wo.taxes_fees || 0);
      
      technicianStats[techId].totalCost += woCost;
    });

    // Calculate averages for technicians
    Object.keys(technicianStats).forEach(techId => {
      const stats = technicianStats[techId];
      stats.avgTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
    });

    // Parts usage tracking
    const partsUsage: Record<string, { quantity: number; cost: number; count: number }> = {};
    
    workOrders.forEach((wo: any) => {
      if (wo.work_order_parts) {
        wo.work_order_parts.forEach((part: any) => {
          const partName = part.part_name || "Unknown Part";
          if (!partsUsage[partName]) {
            partsUsage[partName] = { quantity: 0, cost: 0, count: 0 };
          }
          partsUsage[partName].quantity += part.quantity || 0;
          partsUsage[partName].cost += (part.quantity || 0) * (part.unit_cost || 0);
          partsUsage[partName].count += 1;
        });
      }
    });

    // Completion times by month
    const completionTimesByMonth: { month: string; avgHours: number; count: number }[] = [];
    const monthlyData: Record<string, { totalHours: number; count: number }> = {};

    completedOrders.forEach((wo: any) => {
      if (wo.created_at && wo.closed_at) {
        const month = format(new Date(wo.closed_at), "MMM yyyy");
        if (!monthlyData[month]) {
          monthlyData[month] = { totalHours: 0, count: 0 };
        }
        const hours = differenceInHours(new Date(wo.closed_at), new Date(wo.created_at));
        monthlyData[month].totalHours += hours;
        monthlyData[month].count += 1;
      }
    });

    Object.entries(monthlyData)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .forEach(([month, data]) => {
        completionTimesByMonth.push({
          month,
          avgHours: data.totalHours / data.count,
          count: data.count
        });
      });

    return {
      avgCompletionTime,
      totalCost,
      completedCount: completedOrders.length,
      openCount: workOrders.filter((wo: any) => wo.status !== "completed").length,
      avgCostPerWorkOrder,
      costBreakdown: {
        parts: totalPartsCost,
        labor: totalLaborCost,
        external: totalExternalCost,
        taxes: totalTaxesFees
      },
      issuesByType,
      issuesByPriority,
      technicianStats,
      partsUsage,
      completionTimesByMonth,
      costsByCategory: [
        { category: "Parts & Materials", value: totalPartsCost },
        { category: "Labor", value: totalLaborCost },
        { category: "External/Vendor", value: totalExternalCost },
        { category: "Taxes & Fees", value: totalTaxesFees }
      ]
    };
  }, [workOrders]);

  if (isLoading) {
    return <div className="p-6 text-center">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Work Order Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Performance insights and trends across your maintenance operations
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.avgCompletionTime >= 24 
                ? `${(analytics.avgCompletionTime / 24).toFixed(1)} days`
                : `${analytics.avgCompletionTime.toFixed(1)} hrs`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {analytics.completedCount} completed work orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">
              Avg ${analytics.avgCostPerWorkOrder.toFixed(2)} per work order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Work Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedCount}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.openCount} still open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Common Issue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {Object.entries(analytics.issuesByType).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(analytics.issuesByType).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} occurrences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="parts">Parts Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CompletionTimeChart data={analytics.completionTimesByMonth} />
            <IssueFrequencyChart 
              issuesByType={analytics.issuesByType}
              issuesByPriority={analytics.issuesByPriority}
            />
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CostBreakdownChart data={analytics.costsByCategory} />
            <Card>
              <CardHeader>
                <CardTitle>Cost Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Parts & Materials:</span>
                  <span className="font-medium">${analytics.costBreakdown.parts.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Labor:</span>
                  <span className="font-medium">${analytics.costBreakdown.labor.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">External/Vendor:</span>
                  <span className="font-medium">${analytics.costBreakdown.external.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Taxes & Fees:</span>
                  <span className="font-medium">${analytics.costBreakdown.taxes.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">${analytics.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-4">
          <TechnicianPerformanceTable technicianStats={analytics.technicianStats} />
        </TabsContent>

        <TabsContent value="parts" className="space-y-4">
          <PartsUsageChart partsUsage={analytics.partsUsage} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
