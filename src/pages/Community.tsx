import React from 'react';
import { Users, MapPin, Lightbulb, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';
import { LandingLogo } from '@/components/ui/landing-logo';
import { EnhancedCard } from '@/components/ui/enhanced-card';

export default function Community() {
  const communityCards = [
    {
      icon: Users,
      title: "Community Hub",
      subtitle: "Connect with Other Operators",
      description: "Join our private online community to swap tips, ask questions, and talk business with others who do what you do.",
      buttons: [
        { label: "Join the Community", href: "#", primary: true }
      ]
    },
    {
      icon: MapPin,
      title: "Real-World Operators",
      subtitle: "See PortaPro in Action",
      description: "Explore where PortaPro is being used—from local family-owned companies to large regional fleets. Hear their stories and learn from their playbooks.",
      buttons: [
        { label: "View the Map", href: "#", primary: false },
        { label: "User Stories", href: "#", primary: false }
      ]
    },
    {
      icon: Lightbulb,
      title: "Shape the Future",
      subtitle: "Share Ideas & Influence the Product",
      description: "Submit ideas, vote on features, and follow what's coming next on our public roadmap. Your voice directly impacts what we build.",
      buttons: [
        { label: "View Roadmap", href: "#", primary: false },
        { label: "Submit Feature Idea", href: "#", primary: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </a>
          </div>
          <LandingLogo />
          <div className="w-24"></div> {/* Spacer for centering logo */}
        </div>
      </header>
      {/* Header */}
      <div className="bg-gradient-to-b from-muted/30 to-background border-b">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-foreground">
            Join the PortaPro Community
          </h1>
          <p className="text-lg sm:text-xl text-center text-muted-foreground max-w-2xl mx-auto">
            Where portable sanitation pros connect, learn, and grow together.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Introduction */}
        <div className="max-w-4xl mx-auto mb-12">
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            At PortaPro, we're not just building software — we're building a movement. The PortaPro Community is here to bring together operators, field techs, dispatchers, and business owners who want to modernize operations, reduce chaos, and share real wins from the field.
          </p>
        </div>

        {/* Community Cards */}
        <div className="max-w-5xl mx-auto space-y-6 mb-12">
          {communityCards.map((card, index) => (
            <EnhancedCard 
              key={index} 
              variant="default"
              className="border-border/60 hover:border-border transition-all"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/20">
                    <card.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
                      {card.subtitle}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {card.title}
                    </p>
                  </div>
                </div>
                <p className="text-[15px] sm:text-base text-muted-foreground leading-relaxed mb-6">
                  {card.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  {card.buttons.map((button, btnIndex) => (
                    <button
                      key={btnIndex}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        button.primary
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-md hover:scale-[1.02]'
                          : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                      }`}
                    >
                      {button.label}
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </EnhancedCard>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="max-w-3xl mx-auto text-center">
          <EnhancedCard variant="gradient" className="border-primary/20">
            <div className="p-8 sm:p-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Ready to Connect?
              </h3>
              <p className="text-muted-foreground mb-6 text-base sm:text-lg leading-relaxed">
                Join a growing network of portable sanitation professionals who are modernizing their operations and sharing what works.
              </p>
              <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold text-base">
                Get Started Today
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}