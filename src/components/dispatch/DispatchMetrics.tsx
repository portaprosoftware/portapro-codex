import React from 'react';
import { Users, ClipboardList, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DispatchMetricsProps {
  metrics: {
    totalJobs: number;
    completedJobs: number;
    activeDrivers: number;
    totalDrivers: number;
    unassignedCount: number;
    completionRate: number;
  };
}

export const DispatchMetrics: React.FC<DispatchMetricsProps> = ({ metrics }) => {
  const metricCards = [
    {
      label: 'Total Jobs',
      value: metrics.totalJobs,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Completed',
      value: metrics.completedJobs,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Active Drivers',
      value: `${metrics.activeDrivers}/${metrics.totalDrivers}`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Unassigned',
      value: metrics.unassignedCount,
      icon: AlertTriangle,
      color: metrics.unassignedCount > 0 ? 'text-red-600' : 'text-gray-600',
      bgColor: metrics.unassignedCount > 0 ? 'bg-red-50' : 'bg-gray-50'
    },
    {
      label: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: TrendingUp,
      color: metrics.completionRate >= 80 ? 'text-green-600' : metrics.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: metrics.completionRate >= 80 ? 'bg-green-50' : metrics.completionRate >= 60 ? 'bg-yellow-50' : 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mt-4">
      {metricCards.map((metric, index) => (
        <Card key={index} className={cn("p-3", metric.bgColor)}>
          <div className="flex items-center gap-2">
            <metric.icon className={cn("h-4 w-4", metric.color)} />
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {metric.label}
              </p>
              <p className={cn("text-lg font-semibold", metric.color)}>
                {metric.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};