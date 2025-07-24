import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const gradientButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:shadow-lg hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        primary: "bg-gradient-primary text-white shadow-md",
        secondary: "bg-gradient-secondary text-white shadow-md",
        success: "bg-gradient-green text-white shadow-md",
        warning: "bg-gradient-orange text-white shadow-md",
        danger: "bg-gradient-red text-white shadow-md",
        purple: "bg-gradient-purple text-white shadow-md",
        blue: "bg-gradient-blue text-white shadow-md",
        glass: "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-10 w-10",
      },
      glow: {
        none: "",
        subtle: "hover:shadow-glow/30",
        medium: "hover:shadow-glow/50",
        strong: "hover:shadow-glow",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      glow: "none",
    },
  }
)

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, glow, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
GradientButton.displayName = "GradientButton"

export { GradientButton, gradientButtonVariants }