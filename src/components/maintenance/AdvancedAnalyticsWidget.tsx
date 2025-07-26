import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendChart } from "@/components/analytics/TrendChart";
import { DonutChart } from "@/components/analytics/DonutChart";
import { BarChart3, Clock, DollarSign, Target, TrendingUp } from "lucide-react";

interface AdvancedAnalyticsWidgetProps {
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const AdvancedAnalyticsWidget: React.FC<AdvancedAnalyticsWidgetProps> = ({
  dateRange,
}) => {
  const startDate = dateRange?.start?.toISOString().split('T')[0] || 
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = dateRange?.end?.toISOString().split('T')[0] || 
    new Date().toISOString().split('T')[0];

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["service-analytics", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_service_analytics', {
        start_date: startDate,
        end_date: endDate,
      });

      if (error) throw error;
      return data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </Card>
    );
  }

  const summary = (analytics as any)?.summary || {};
  const topServices = (analytics as any)?.top_services || [];
  const statusBreakdown = (analytics as any)?.status_breakdown || {};

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Reports</p>
              <p className="text-2xl font-bold text-blue-900">{summary.total_reports || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completion Rate</p>
              <p className="text-2xl font-bold text-green-900">{summary.completion_rate || 0}%</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Avg. Completion</p>
              <p className="text-2xl font-bold text-purple-900">{summary.avg_completion_hours || 0}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Completed</p>
              <p className="text-2xl font-bold text-orange-900">{summary.completed_reports || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          {Object.keys(statusBreakdown).length > 0 ? (
            <DonutChart
              title="Status Distribution"
              data={Object.entries(statusBreakdown).map(([status, count]) => ({
                name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: count as number,
                color: getStatusColor(status),
              }))}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No status data available
            </div>
          )}
        </Card>

        {/* Top Services */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
          <div className="space-y-3">
            {topServices.slice(0, 5).map((service: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{service.service_name}</p>
                  <p className="text-sm text-gray-600">{service.service_code}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">{service.usage_count} uses</p>
                  {service.total_revenue > 0 && (
                    <p className="text-sm text-green-600">${Number(service.total_revenue).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
            {topServices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No service data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Period Information */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Analysis Period</span>
          <span>
            {new Date((analytics as any).period_start).toLocaleDateString()} - {new Date((analytics as any).period_end).toLocaleDateString()}
          </span>
        </div>
      </Card>
    </div>
  );
};

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return '#22c55e';
    case 'in_progress':
      return '#3b82f6';
    case 'open':
    case 'scheduled':
      return '#f59e0b';
    case 'overdue':
      return '#ef4444';
    case 'cancelled':
      return '#6b7280';
    default:
      return '#8b5cf6';
  }
}