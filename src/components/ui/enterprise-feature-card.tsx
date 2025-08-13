import * as React from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface EnterpriseFeatureCardProps {
  title: string
  description: string
  Icon: LucideIcon
  onClick?: () => void
  badge?: string
}

export const EnterpriseFeatureCard = React.forwardRef<HTMLDivElement, EnterpriseFeatureCardProps>(
  ({ title, description, Icon, onClick, badge }, ref) => {
    return (
      <article
        ref={ref}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : -1}
        onClick={onClick}
        onKeyDown={(e) => {
          if (!onClick) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick()
          }
        }}
        className={cn(
          "group relative rounded-2xl border border-border bg-white text-foreground p-6",
          "transition-all duration-200 cursor-pointer",
          "shadow-sm hover:shadow-lg hover:-translate-y-0.5",
          "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        )}
      >
        {/* Optional top accent bar */}
        <div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-primary rounded-t-[inherit]" />

        {/* Corner badge (optional) */}
        {badge && (
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
            {badge}
          </span>
        )}

        {/* Icon disc */}
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/20">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold leading-snug">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>

        {/* CTA */}
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
          <span>Learn more</span>
          <svg
            className="h-3.5 w-3.5 transform transition-transform duration-150 group-hover:translate-x-0.5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </article>
    )
  }
)

EnterpriseFeatureCard.displayName = "EnterpriseFeatureCard"
