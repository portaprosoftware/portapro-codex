
import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: string;
  chart?: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  chart,
  subtitle,
  loading = false
}) => {
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card className="p-6 rounded-2xl shadow-md border-l-4 animate-pulse" style={{ borderLeftColor: color }}>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl shadow-md border-l-4 hover:shadow-lg transition-shadow duration-200" style={{ borderLeftColor: color }}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Value */}
        <div className="space-y-1">
          <div className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          {/* Change indicator */}
          {change !== undefined && (
            <div className={cn("text-sm font-medium", getChangeColor(change))}>
              {formatChange(change)}
              {subtitle && <span className="text-gray-500 ml-1">vs last period</span>}
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && change === undefined && (
            <div className="text-sm text-gray-500">{subtitle}</div>
          )}
        </div>

        {/* Chart */}
        {chart && (
          <div className="mt-4">
            {chart}
          </div>
        )}
      </div>
    </Card>
  );
};
