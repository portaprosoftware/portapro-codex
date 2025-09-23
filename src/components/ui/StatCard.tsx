
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
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
  onClick?: () => void;
  clickable?: boolean;
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
  delay = 0,
  onClick,
  clickable = false
}) => {
  // Extract numeric value for animation - skip if React element
  const isReactElement = React.isValidElement(value);
  const numericValue = !isReactElement && typeof value === 'string' ? 
    parseInt(value.replace(/[^0-9]/g, '')) || 0 : 
    typeof value === 'number' ? value : 0;
  
  const animatedValue = useCountUp({
    end: numericValue,
    duration: 600,
    delay: delay
  });

  // Format the animated value back to original format
  const displayValue = isReactElement ? value :
    animateValue && typeof value === 'number' ? 
    animatedValue : 
    typeof value === 'string' && animateValue ? 
      value.replace(/[0-9,]+/, animatedValue.toLocaleString()) : 
      value;

  return (
    <div 
      className={cn(
        "relative overflow-hidden transition-all duration-300 ease-out",
        "bg-gradient-to-b from-[#F6F9FF] to-white",
        "rounded-xl border border-gray-200 shadow-sm",
        "hover:shadow-md hover:-translate-y-1",
        "p-4 h-32", // Larger cards with more space
        clickable && "cursor-pointer hover:shadow-lg hover:-translate-y-2",
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      {/* Gradient left border */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{
          background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`
        }}
      />
      
      {/* Main content in horizontal layout */}
      <div className="flex items-center justify-between h-full">
        {/* Left side - Value and title */}
        <div className="flex-1 min-w-0">
          {/* Value */}
          <div className={cn(
            "leading-tight mb-1 font-sans",
            isReactElement ? "" : "text-xl font-bold text-gray-900"
          )}>
            {displayValue}
          </div>
          
          {/* Title */}
          <div className="text-sm font-semibold text-gray-900 font-sans leading-tight">
            {title}
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <div className={cn("text-xs font-medium font-sans truncate", subtitleColor)}>
              {subtitle}
            </div>
          )}
        </div>
        
        {/* Right side - Icon */}
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md transition-all duration-200 flex-shrink-0 ml-3"
          style={{ 
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            animationDelay: `${delay}ms`,
            boxShadow: `0 4px 12px -4px ${gradientFrom}40`
          }}
        >
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};
