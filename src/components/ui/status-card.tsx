import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";

const statusCardVariants = cva(
  "relative rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md hover-lift overflow-hidden",
  {
    variants: {
      status: {
        pending: "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50",
        assigned: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50", 
        in_progress: "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50",
        completed: "border-green-200 bg-gradient-to-br from-green-50 to-green-100/50",
        cancelled: "border-red-200 bg-gradient-to-br from-red-50 to-red-100/50",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      },
    },
    defaultVariants: {
      status: "pending",
      size: "default",
    },
  }
);

const statusBadgeVariants = {
  pending: "bg-gradient-orange text-white shadow-sm",
  assigned: "bg-gradient-blue text-white shadow-sm",
  in_progress: "bg-gradient-purple text-white shadow-sm", 
  completed: "bg-gradient-green text-white shadow-sm",
  cancelled: "bg-gradient-red text-white shadow-sm",
};

export interface StatusCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusCardVariants> {
  title: string;
  subtitle?: string;
  status: keyof typeof statusBadgeVariants;
  icon?: LucideIcon;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  metadata?: {
    label: string;
    value: string;
  }[];
}

const StatusCard = React.forwardRef<HTMLDivElement, StatusCardProps>(
  ({ 
    className, 
    title, 
    subtitle, 
    status, 
    size, 
    icon: Icon, 
    actionButton,
    metadata,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusCardVariants({ status, size }), className)}
        {...props}
      >
        {/* Status stripe */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          status === "pending" && "bg-gradient-orange",
          status === "assigned" && "bg-gradient-blue", 
          status === "in_progress" && "bg-gradient-purple",
          status === "completed" && "bg-gradient-green",
          status === "cancelled" && "bg-gradient-red"
        )} />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                status === "pending" && "bg-gradient-orange",
                status === "assigned" && "bg-gradient-blue",
                status === "in_progress" && "bg-gradient-purple", 
                status === "completed" && "bg-gradient-green",
                status === "cancelled" && "bg-gradient-red"
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          <Badge className={statusBadgeVariants[status]}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {metadata.map((item, index) => (
              <div key={index}>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {item.label}
                </dt>
                <dd className="text-sm font-semibold text-gray-900 mt-1">
                  {item.value}
                </dd>
              </div>
            ))}
          </div>
        )}

        {/* Action button */}
        {actionButton && (
          <Button
            variant={actionButton.variant || "outline"}
            size="sm"
            onClick={actionButton.onClick}
            className="w-full mt-4"
          >
            {actionButton.label}
          </Button>
        )}
      </div>
    );
  }
);
StatusCard.displayName = "StatusCard";

export { StatusCard, statusCardVariants };