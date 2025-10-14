import React, { useEffect } from 'react'
import { featureGroups } from '@/data/featuresCatalog'

export default function Features() {
  // SEO: title + description
  useEffect(() => {
    document.title = 'Features - PortaPro'
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta');
      m.setAttribute('name', 'description');
      document.head.appendChild(m);
      return m;
    })()
    meta.setAttribute('content', 'Explore all PortaPro features: operations, workflow, and management tools built for portable toilet rental companies.')
  }, [])

  return (
    <main className="container mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">All Features</h1>
        <p className="text-muted-foreground mt-1">A complete overview of what PortaPro delivers.</p>
      </header>

      {featureGroups.map((group) => (
        <section key={group.key} id={group.key} className="mb-10">
          <h2 className="text-xl font-semibold mb-3">{group.title}</h2>
          <ul className="divide-y rounded-xl border bg-background">
            {group.items.map((item) => (
              <li key={item.key} className="p-4">
                <a href={item.href.startsWith('#') ? `/landing${item.href}` : item.href} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
