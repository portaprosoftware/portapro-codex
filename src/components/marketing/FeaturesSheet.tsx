import React, { useEffect, useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { featureGroups } from '@/data/featuresCatalog'
import { cn } from '@/lib/utils'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeaturesSheet({ open, onOpenChange }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: false })

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveIdx(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
  }, [emblaApi])

  const goTo = (i: number) => emblaApi?.scrollTo(i)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <DrawerContent className="mx-auto max-w-md rounded-t-2xl" aria-label="Features">
        <div className="mx-auto h-[85vh] w-full max-w-md">
          <DrawerHeader className="pb-2">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" aria-hidden />
            <DrawerTitle className="mt-2 text-base">Features</DrawerTitle>
          </DrawerHeader>

          {/* Category pills */}
          <div className="px-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {featureGroups.map((g, i) => (
                <button
                  key={g.key}
                  onClick={() => goTo(i)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-3 py-1.5 text-sm',
                    i === activeIdx ? 'bg-primary/10 text-primary font-semibold' : 'bg-muted text-foreground'
                  )}
                  aria-pressed={i === activeIdx}
                >
                  {g.title.split('&')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Swipeable content */}
          <div className="mt-1" ref={emblaRef}>
            <div className="flex">
              {featureGroups.map((group) => (
                <div key={group.key} className="min-w-0 shrink-0 grow-0 basis-full px-4">
                  <ul className="divide-y">
                    {group.items.map((item) => (
                      <li key={item.key}>
                        <a
                          href={item.href.startsWith('#') ? item.href : `/features#${item.key}`}
                          className="flex items-center gap-3 py-3"
                          aria-label={`${item.label} — ${item.description}`}
                          onClick={() => onOpenChange(false)}
                        >
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <item.icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[15px] font-semibold truncate">{item.label}</span>
                            <span className="block text-xs text-muted-foreground truncate">{item.description}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Utility row */}
          <div className="mt-2 flex items-center justify-between px-4 pb-4 pt-2 border-t">
            <a href="/features" className="text-sm font-medium text-primary hover:underline">
              View all features
            </a>
            <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noreferrer">
              <Button size="sm" className="text-xs">Start free trial</Button>
            </a>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default FeaturesSheet
