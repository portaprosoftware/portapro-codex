
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  subtitle?: string;
  subtitleColor?: string;
  chart?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  gradientFrom,
  gradientTo,
  iconBg,
  subtitle,
  subtitleColor = "text-gray-600",
  chart,
  className
}) => {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative overflow-hidden",
      className
    )}>
      {/* Gradient left border */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`
        }}
      />
      
      {/* Icon container */}
      <div className="flex justify-end mb-2">
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      
      {/* Value */}
      <div className="text-3xl font-semibold text-gray-900 mb-1">
        {value}
      </div>
      
      {/* Title */}
      <div className="text-sm text-gray-600 mb-2">
        {title}
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <div className={cn("text-xs", subtitleColor)}>
          {subtitle}
        </div>
      )}
      
      {/* Chart */}
      {chart && (
        <div className="mt-2">
          {chart}
        </div>
      )}
    </div>
  );
};
