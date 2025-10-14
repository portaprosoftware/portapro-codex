import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { featureGroups } from '@/data/featuresCatalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LandingLogo } from '@/components/ui/landing-logo'
import { Button } from '@/components/ui/button'

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

    // Add ItemList schema
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: featureGroups.flatMap((group, groupIdx) =>
        group.items.map((item, itemIdx) => ({
          '@type': 'ListItem',
          position: groupIdx * 10 + itemIdx + 1,
          name: item.label,
          description: item.description,
          url: `https://portapro.com${item.href}`
        }))
      )
    })
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/landing" className="flex items-center gap-2">
            <LandingLogo />
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/landing#pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-16">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">All Features</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            A complete overview of what PortaPro delivers. Click any feature to learn more.
          </p>
        </header>

        {featureGroups.map((group) => (
          <section key={group.key} className="mb-16">
            <h2 className="mb-6 text-2xl font-bold">{group.title}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Link key={item.key} to={item.href}>
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60">
                          <item.icon className="h-6 w-6 text-white" />
                        </div>
                        {item.badge && (
                          <Badge variant="secondary">{item.badge}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{item.label}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        Learn More <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 PortaPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
