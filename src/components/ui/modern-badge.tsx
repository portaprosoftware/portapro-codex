import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const modernBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 hover:shadow-md hover:scale-105",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-white shadow-sm",
        secondary: "bg-gradient-secondary text-white shadow-sm",
        success: "bg-gradient-green text-white shadow-sm",
        warning: "bg-gradient-orange text-white shadow-sm",
        danger: "bg-gradient-red text-white shadow-sm",
        purple: "bg-gradient-purple text-white shadow-sm",
        blue: "bg-gradient-blue text-white shadow-sm",
        outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white",
        glass: "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-3 py-1 text-xs",
        lg: "px-4 py-2 text-sm",
      },
      glow: {
        none: "",
        subtle: "shadow-colored/20",
        medium: "shadow-colored/40", 
        strong: "shadow-colored/60",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
);

const statusColors = {
  pending: { bg: "bg-gradient-orange", glow: "shadow-orange-500/30" },
  assigned: { bg: "bg-gradient-blue", glow: "shadow-blue-500/30" },
  in_progress: { bg: "bg-gradient-purple", glow: "shadow-purple-500/30" },
  completed: { bg: "bg-gradient-green", glow: "shadow-green-500/30" },
  cancelled: { bg: "bg-gradient-to-r from-black to-gray-800 text-white font-bold", glow: "shadow-black/30" },
  draft: { bg: "bg-gray-100 text-gray-800", glow: "shadow-gray-500/20" },
  active: { bg: "bg-gradient-primary", glow: "shadow-blue-500/30" },
  inactive: { bg: "bg-gray-400 text-white", glow: "shadow-gray-500/20" },
};

export interface ModernBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modernBadgeVariants> {
  status?: keyof typeof statusColors;
  icon?: React.ReactNode;
  pulse?: boolean;
}

const ModernBadge = React.forwardRef<HTMLDivElement, ModernBadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    glow,
    status, 
    icon, 
    pulse = false,
    children,
    ...props 
  }, ref) => {
    const statusStyle = status ? statusColors[status] : null;
    
    return (
      <div
        ref={ref}
        className={cn(
          modernBadgeVariants({ variant: statusStyle ? undefined : variant, size, glow }),
          statusStyle?.bg,
          statusStyle?.glow,
          pulse && "animate-pulse-glow",
          className
        )}
        {...props}
      >
        {icon && (
          <span className="w-3 h-3 flex items-center justify-center">
            {icon}
          </span>
        )}
        {children}
      </div>
    );
  }
);
ModernBadge.displayName = "ModernBadge";

export { ModernBadge, modernBadgeVariants };