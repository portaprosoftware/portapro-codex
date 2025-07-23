
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
      "bg-white rounded-xl border border-gray-200 p-4 relative overflow-hidden transition-all duration-200 hover:shadow-md mb-6",
      "hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
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
      <div className="flex justify-end mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
          style={{ 
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      
      {/* Value */}
      <div className="text-[32px] font-semibold text-gray-900 leading-none mb-1">
        {value}
      </div>
      
      {/* Title */}
      <div className="text-base font-semibold text-gray-900 mb-2">
        {title}
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <div className={cn("text-sm font-normal", subtitleColor)}>
          {subtitle}
        </div>
      )}
      
      {/* Chart */}
      {chart && (
        <div className="mt-3">
          {chart}
        </div>
      )}
    </div>
  );
};
