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
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      label: 'Completed',
      value: metrics.completedJobs,
      icon: CheckCircle,
      gradient: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      label: 'Active Drivers',
      value: `${metrics.activeDrivers}/${metrics.totalDrivers}`,
      icon: Users,
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    {
      label: 'Unassigned',
      value: metrics.unassignedCount,
      icon: AlertTriangle,
      gradient: metrics.unassignedCount > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'
    },
    {
      label: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: TrendingUp,
      gradient: metrics.completionRate >= 80 
        ? 'bg-gradient-to-br from-green-500 to-green-600' 
        : metrics.completionRate >= 60 
        ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' 
        : 'bg-gradient-to-br from-red-500 to-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mt-4">
      {metricCards.map((metric, index) => (
        <Card key={index} className={cn("p-3 border-0", metric.gradient)}>
          <div className="flex items-center gap-2">
            <metric.icon className="h-4 w-4 text-white" />
            <div>
              <p className="text-xs text-white/80 font-medium">
                {metric.label}
              </p>
              <p className="text-lg font-semibold text-white">
                {metric.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};