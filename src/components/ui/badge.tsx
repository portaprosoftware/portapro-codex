import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-white shadow-sm",
        secondary: "bg-gradient-secondary text-white shadow-sm",
        destructive: "bg-gradient-red text-white shadow-sm",
        outline: "border border-primary text-primary bg-transparent",
        
        // Status variants - all solid gradients with bold white text
        pending: "bg-gradient-orange text-white shadow-sm",
        assigned: "bg-gradient-blue text-white shadow-sm",
        unassigned: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm",
        "in-progress": "bg-gradient-purple text-white shadow-sm",
        completed: "bg-gradient-green text-white shadow-sm",
        cancelled: "bg-gradient-red text-white shadow-sm",
        draft: "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm",
        
        // Legacy variants for backward compatibility
        success: "bg-gradient-green text-white shadow-sm",
        warning: "bg-gradient-orange text-white shadow-sm",
        info: "bg-gradient-blue text-white shadow-sm",
        purple: "bg-gradient-purple text-white shadow-sm",
        gradient: "bg-gradient-primary text-white shadow-sm",
        active: "bg-gradient-green text-white shadow-sm",
        inactive: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm",
        
        // Priority and special status variants
        priority: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md",
        overdue: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md",
        was_overdue: "bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md",
        completed_late: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
