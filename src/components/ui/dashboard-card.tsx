import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const dashboardCardVariants = cva(
  "relative rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover-lift overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-card",
        gradient: "bg-gradient-to-br from-white to-gray-50/50",
        elevated: "shadow-lg",
        outlined: "border-2",
      },
      size: {
        default: "p-6",
        sm: "p-4", 
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface DashboardCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dashboardCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  chart?: React.ReactNode;
  delay?: number;
}

const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ 
    className, 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    gradientFrom, 
    gradientTo,
    change,
    chart,
    delay = 0,
    variant,
    size,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(dashboardCardVariants({ variant, size }), className)}
        style={{ animationDelay: `${delay}ms` }}
        {...props}
      >
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
        <div className="mb-2">
          <h3 className="text-3xl font-bold text-gray-900 animate-fade-in"
              style={{ animationDelay: `${delay + 100}ms` }}>
            {value}
          </h3>
          {change && (
            <div className={cn(
              "inline-flex items-center text-xs font-medium mt-1",
              change.trend === "up" && "text-green-600",
              change.trend === "down" && "text-red-600", 
              change.trend === "neutral" && "text-gray-600"
            )}>
              {change.trend === "up" && "↗"}
              {change.trend === "down" && "↘"}
              {change.trend === "neutral" && "→"}
              <span className="ml-1">{change.value}</span>
            </div>
          )}
        </div>

        {/* Title and subtitle */}
        <div className="animate-fade-in" style={{ animationDelay: `${delay + 200}ms` }}>
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>

        {/* Chart if provided */}
        {chart && (
          <div className="mt-4 animate-fade-in" style={{ animationDelay: `${delay + 300}ms` }}>
            {chart}
          </div>
        )}
      </div>
    );
  }
);
DashboardCard.displayName = "DashboardCard";

export { DashboardCard, dashboardCardVariants };