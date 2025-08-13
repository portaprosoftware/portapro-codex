import React from 'react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { featureGroups } from '@/data/featuresCatalog'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function FeaturesMegaMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-sm font-medium shadow-none hover:shadow-none bg-transparent hover:bg-muted/50 transition-colors hover:scale-105 transform duration-200">
            Features
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[820px] max-w-[88vw] p-4 md:p-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-xl shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {featureGroups.map((group, groupIdx) => (
                  <section key={group.key} aria-labelledby={`features-group-${group.key}`}>
                    <h3 id={`features-group-${group.key}`} className="mb-2 text-sm font-semibold text-muted-foreground">
                      {group.title}
                    </h3>
                    <ul className="space-y-1.5">
                      {group.items.map((item, idx) => (
                        <li key={item.key}>
                          <NavigationMenuLink asChild>
                            <a
                              href={item.href.startsWith('#') ? item.href : `/features#${item.key}`}
                              className={cn(
                                'group flex items-start gap-3 rounded-lg p-2 transition-colors',
                                'hover:bg-muted focus:bg-muted focus:outline-none'
                              )}
                              aria-label={`${item.label} — ${item.description}`}
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
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-end gap-4">
                <a href="/features#whats-new" className="text-xs text-muted-foreground hover:text-foreground">
                  What’s new
                </a>
                <a href="/features" className="text-sm font-medium text-primary hover:underline">
                  View all features →
                </a>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

export default FeaturesMegaMenu
