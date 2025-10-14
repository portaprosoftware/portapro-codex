import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { LandingLogo } from '@/components/ui/landing-logo'
import { FeaturePageContent } from '@/data/featuresContent'

interface FeaturePageTemplateProps {
  content: FeaturePageContent
}

export const FeaturePageTemplate: React.FC<FeaturePageTemplateProps> = ({ content }) => {
  const { hero, problemOutcome, capabilities, howItWorks, proof, integrations, faqs, stickyCTA, relatedFeatures } = content

  useEffect(() => {
    // SEO: Set page title and meta description
    document.title = `PortaPro — ${hero.title} for Portable Toilet Operators`
    const metaDescription = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement('meta')
      m.setAttribute('name', 'description')
      document.head.appendChild(m)
      return m
    })()
    metaDescription.setAttribute('content', hero.subtitle)

    // Add FAQPage schema
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    })
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [hero.title, hero.subtitle, faqs])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/landing" className="flex items-center gap-2">
            <LandingLogo />
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/features" className="text-sm font-medium hover:text-primary">
              All Features
            </Link>
            <Link to="/landing#pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">{hero.title}</h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">{hero.subtitle}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  {hero.primaryCTA}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {hero.secondaryCTA && (
                <Button size="lg" variant="outline" className="gap-2">
                  {hero.secondaryCTA}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Outcome Section */}
      <section className="border-b py-16">
        <div className="container mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">Why This Matters</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {problemOutcome.map((item, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="mb-2 text-sm font-medium text-destructive">The Problem</div>
                  <CardDescription>{item.pain}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold text-primary">The Outcome</div>
                      <p className="text-sm">{item.outcome}</p>
                    </div>
                  </div>
                  {item.metric && (
                    <Badge variant="secondary" className="mt-2">
                      {item.metric}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <section className="border-b bg-muted/20 py-16">
        <div className="container mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">Key Capabilities</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {capabilities.map((cap, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <cap.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{cap.title}</CardTitle>
                  </div>
                  <CardDescription>{cap.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-b py-16">
        <div className="container mx-auto max-w-5xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">How It Works</h2>
          <div className="space-y-6">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {step.step}
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  {step.screenshot && (
                    <div className="mt-4 overflow-hidden rounded-lg border">
                      <img src={step.screenshot} alt={step.title} className="w-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof Section */}
      {proof && (
        <section className="border-b bg-muted/20 py-16">
          <div className="container mx-auto max-w-4xl px-6">
            <Card>
              <CardContent className="pt-6">
                <blockquote className="mb-4 text-lg italic">"{proof.quote}"</blockquote>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">— {proof.author}</div>
                    <div className="text-sm text-primary">{proof.result}</div>
                  </div>
                  {proof.logo && <img src={proof.logo} alt="Company logo" className="h-8" />}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Integrations Section */}
      {integrations.length > 0 && (
        <section className="border-b py-16">
          <div className="container mx-auto max-w-5xl px-6">
            <h2 className="mb-6 text-center text-2xl font-bold">Integrations</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {integrations.map((integration, idx) => (
                <Badge key={idx} variant="outline" className="gap-2 px-4 py-2">
                  <integration.icon className="h-4 w-4" />
                  {integration.name}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="border-b py-16">
        <div className="container mx-auto max-w-3xl px-6">
          <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Related Features Section */}
      {relatedFeatures && relatedFeatures.length > 0 && (
        <section className="border-b bg-muted/20 py-16">
          <div className="container mx-auto max-w-5xl px-6">
            <h2 className="mb-6 text-center text-2xl font-bold">Related Features</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {relatedFeatures.map((slug, idx) => (
                <Link key={idx} to={`/features/${slug}`}>
                  <Button variant="outline" className="gap-2">
                    View {slug.replace(/-/g, ' ')}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky CTA */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link to={stickyCTA.action}>
          <Button size="lg" className="gap-2 shadow-lg">
            {stickyCTA.text}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2025 PortaPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
