
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  subtitle?: string | React.ReactNode;
  subtitleColor?: string;
  chart?: React.ReactNode;
  className?: string;
  animateValue?: boolean;
  delay?: number;
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
  className,
  animateValue = true,
  delay = 0
}) => {
  // Extract numeric value for animation
  const numericValue = typeof value === 'string' ? 
    parseInt(value.replace(/[^0-9]/g, '')) || 0 : 
    value;
  
  const animatedValue = useCountUp({
    end: numericValue,
    duration: 600,
    delay: delay
  });

  // Format the animated value back to original format
  const displayValue = animateValue && typeof value === 'number' ? 
    animatedValue : 
    typeof value === 'string' && animateValue ? 
      value.replace(/[0-9,]+/, animatedValue.toLocaleString()) : 
      value;

  return (
    <div className={cn(
      "relative overflow-hidden transition-all duration-300 ease-out",
      "bg-gradient-to-b from-[#F6F9FF] to-white",
      "rounded-xl border border-gray-200 shadow-sm",
      "hover:shadow-md hover:-translate-y-1",
      "p-4 mb-4",
      className
    )}>
      {/* Gradient left border */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{
          background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`
        }}
      />
      
      {/* Icon container */}
      <div className="flex justify-end mb-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 animate-fade-in animate-scale-in"
          style={{ 
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            animationDelay: `${delay}ms`,
            boxShadow: `0 8px 20px -8px ${gradientFrom}40`
          }}
        >
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
      </div>
      
      {/* Value */}
      <div className="text-2xl font-bold text-gray-900 leading-none mb-1 font-sans">
        {displayValue}
      </div>
      
      {/* Title */}
      <div className="text-sm font-semibold text-gray-900 mb-1 font-sans">
        {title}
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <div className={cn("text-xs font-medium font-sans", subtitleColor)}>
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
