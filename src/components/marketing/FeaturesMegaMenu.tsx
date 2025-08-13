import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { featureGroups } from '@/data/featuresCatalog'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'

interface FeaturesMegaMenuRef {
  triggerOpen: () => void
}

export const FeaturesMegaMenu = forwardRef<FeaturesMegaMenuRef>((props, ref) => {
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    triggerOpen: () => setOpen(true)
  }))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className="text-sm font-medium shadow-none hover:shadow-none bg-transparent hover:bg-muted/50 transition-colors hover:scale-105 transform duration-200 flex items-center gap-1"
          aria-expanded={open}
        >
          Features
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[820px] max-w-[88vw] p-4 md:p-6 bg-gradient-to-b from-muted via-muted to-muted/70 border rounded-xl shadow-lg"
        align="start"
        sideOffset={8}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {featureGroups.map((group, groupIdx) => (
            <section key={group.key} aria-labelledby={`features-group-${group.key}`}>
              <h3 id={`features-group-${group.key}`} className="mb-2 text-sm font-semibold text-muted-foreground">
                {group.title}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <li key={item.key}>
                    <a
                      href={item.href.startsWith('#') ? item.href : `/features#${item.key}`}
                      className={cn(
                        'group flex items-start gap-3 rounded-lg p-2 transition-colors',
                        'hover:bg-muted focus:bg-muted focus:outline-none'
                      )}
                      aria-label={`${item.label} — ${item.description}`}
                      onClick={() => setOpen(false)} // Close dropdown when item is clicked
                    >
                      <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-foreground truncate">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{item.badge}</Badge>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">{item.description}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
})

FeaturesMegaMenu.displayName = 'FeaturesMegaMenu'

export default FeaturesMegaMenu