import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const actionCardVariants = cva(
  "group relative rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover-lift cursor-pointer overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-card hover:bg-gradient-to-br hover:from-white hover:to-gray-50",
        primary: "bg-gradient-primary text-white hover:brightness-110",
        secondary: "bg-gradient-secondary text-white hover:brightness-110", 
        success: "bg-gradient-green text-white hover:brightness-110",
        warning: "bg-gradient-orange text-white hover:brightness-110",
        danger: "bg-gradient-red text-white hover:brightness-110",
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

export interface ActionCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof actionCardVariants> {
  title: string;
  description?: string;
  icon: LucideIcon;
  badge?: string;
  disabled?: boolean;
}

const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({ 
    className, 
    title, 
    description, 
    icon: Icon, 
    badge,
    disabled = false,
    variant,
    size,
    onClick,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          actionCardVariants({ variant, size }),
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {/* Badge */}
        {badge && (
          <div className="absolute top-3 right-3">
            <span className={cn(
              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
              variant === "default" ? "bg-blue-100 text-blue-800" : "bg-white/20 text-white"
            )}>
              {badge}
            </span>
          </div>
        )}

        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-110",
          variant === "default" ? "bg-gradient-primary" : "bg-white/20"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            variant === "default" ? "text-white" : "text-white"
          )} strokeWidth={2} />
        </div>

        {/* Content */}
        <div>
          <h3 className={cn(
            "font-semibold mb-2 group-hover:translate-x-1 transition-transform duration-200",
            variant === "default" ? "text-gray-900" : "text-white"
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              "text-sm group-hover:translate-x-1 transition-transform duration-200 delay-75",
              variant === "default" ? "text-gray-600" : "text-white/80"
            )}>
              {description}
            </p>
          )}
        </div>

        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </div>
    );
  }
);
ActionCard.displayName = "ActionCard";

export { ActionCard, actionCardVariants };