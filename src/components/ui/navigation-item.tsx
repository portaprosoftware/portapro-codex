import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const navigationItemVariants = cva(
  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm cursor-pointer group",
  {
    variants: {
      variant: {
        default: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        active: "bg-gradient-primary text-white shadow-sm",
        secondary: "text-gray-600 hover:bg-blue-50 hover:text-blue-700",
        danger: "text-red-600 hover:bg-red-50 hover:text-red-700",
      },
      size: {
        sm: "px-2 py-1.5 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface NavigationItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof navigationItemVariants> {
  icon?: LucideIcon;
  label: string;
  badge?: string | number;
  collapsed?: boolean;
}

const NavigationItem = React.forwardRef<HTMLDivElement, NavigationItemProps>(
  ({ 
    className, 
    variant, 
    size,
    icon: Icon, 
    label, 
    badge,
    collapsed = false,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(navigationItemVariants({ variant, size }), className)}
        {...props}
      >
        {Icon && (
          <Icon className={cn(
            "flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
            size === "sm" && "w-4 h-4",
            size === "default" && "w-5 h-5",
            size === "lg" && "w-6 h-6"
          )} strokeWidth={2} />
        )}
        
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {badge && (
              <span className={cn(
                "inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full min-w-[1.25rem] h-5",
                variant === "active" 
                  ? "bg-white/20 text-white" 
                  : "bg-blue-100 text-blue-600"
              )}>
                {badge}
              </span>
            )}
          </>
        )}

        {collapsed && badge && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>
    );
  }
);
NavigationItem.displayName = "NavigationItem";

export { NavigationItem, navigationItemVariants };