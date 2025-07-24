
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:shadow-lg hover:-translate-y-0.5 font-sans",
  {
    variants: {
      variant: {
        default: "gradient-primary text-white hover:brightness-110",
        primary: "bg-gradient-primary text-white shadow-md hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "btn-secondary border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "btn-secondary",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:shadow-none hover:transform-none",
        link: "text-primary underline-offset-4 hover:underline hover:shadow-none hover:transform-none",
        gradient: "bg-gradient-primary text-white shadow-md",
        success: "bg-gradient-green text-white shadow-md",
        warning: "bg-gradient-orange text-white shadow-md",
        purple: "bg-gradient-purple text-white shadow-md",
        ocean: "bg-gradient-ocean text-white shadow-md",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4 py-2",
        lg: "h-14 rounded-xl px-8 py-4",
        xl: "h-16 rounded-xl px-10 py-5 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{ willChange: 'transform, box-shadow' }}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
