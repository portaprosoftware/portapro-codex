import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const floatingActionButtonVariants = cva(
  "fixed z-50 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110 active:scale-95 flex items-center justify-center font-semibold",
  {
    variants: {
      variant: {
        primary: "bg-gradient-primary text-white hover:brightness-110",
        secondary: "bg-gradient-secondary text-white hover:brightness-110",
        success: "bg-gradient-green text-white hover:brightness-110",
        warning: "bg-gradient-orange text-white hover:brightness-110",
        danger: "bg-gradient-red text-white hover:brightness-110",
      },
      size: {
        sm: "w-12 h-12",
        default: "w-14 h-14",
        lg: "w-16 h-16",
      },
      position: {
        "bottom-right": "bottom-6 right-6",
        "bottom-left": "bottom-6 left-6",
        "top-right": "top-6 right-6",
        "top-left": "top-6 left-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      position: "bottom-right",
    },
  }
);

export interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof floatingActionButtonVariants> {
  icon: LucideIcon;
  label?: string;
  tooltip?: string;
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    position,
    icon: Icon, 
    label,
    tooltip,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(floatingActionButtonVariants({ variant, size, position }), className)}
        title={tooltip}
        {...props}
      >
        <Icon className={cn(
          "text-white",
          size === "sm" && "w-5 h-5",
          size === "default" && "w-6 h-6", 
          size === "lg" && "w-7 h-7"
        )} strokeWidth={2} />
        {label && (
          <span className="ml-2 whitespace-nowrap">{label}</span>
        )}
      </button>
    );
  }
);
FloatingActionButton.displayName = "FloatingActionButton";

export { FloatingActionButton, floatingActionButtonVariants };