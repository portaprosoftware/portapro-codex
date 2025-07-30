import React, { useState, useEffect } from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ArrowRight, Play, CheckCircle, Truck, Users, BarChart3, ClipboardList, MapPin, Calendar, DollarSign, Zap, Building2, FileText, Smartphone, Heart, Phone, Mail, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';

// Core Features Data
const coreFeatures = [{
  title: "Smart Job Wizard",
  description: "Step-by-step job creation: delivery, pickups, crew, and invoicing.",
  icon: ClipboardList,
  href: "#job-wizard"
}, {
  title: "Inventory & Supplies",
  description: "Track units and consumables across multiple storage sites.",
  icon: Building2,
  href: "#inventory"
}, {
  title: "Quotes & Payments",
  description: "Build quotes with services and supplies, collect deposits online.",
  icon: DollarSign,
  href: "#quotes"
}, {
  title: "Driver Mobile App",
  description: "Offline-capable route navigation, job updates, and digital checklists.",
  icon: Smartphone,
  href: "#mobile-app"
}];

// Job Wizard Steps
const jobWizardSteps = [{
  number: "1",
  title: "Customer & Address",
  description: "Select or create customer profiles"
}, {
  number: "2",
  title: "Delivery & Pickup Dates",
  description: "Schedule with calendar integration"
}, {
  number: "3",
  title: "Supplies & Extras",
  description: "Add units and consumables"
}, {
  number: "4",
  title: "Crew & Vehicle Assignment",
  description: "Auto-assign available teams"
}, {
  number: "5",
  title: "Review & Confirm",
  description: "Final pricing and confirmation"
}];

// Inventory Features
const inventoryFeatures = [{
  title: "Bulk vs. Unit Tracking",
  icon: BarChart3
}, {
  title: "Date-Range Availability Checker",
  icon: Calendar
}, {
  title: "Automatic Low-Stock Alerts",
  icon: Zap
}];

// Quote Flow Steps
const quoteFlow = ["Quote Builder", "Customer Portal", "Deposit Collection (Stripe)", "Auto Job Creation"];

// Team Management Features
const teamFeatures = ["User Profiles & Roles", "Drag-and-Drop Shift Scheduling", "Time-Off Requests with Calendar Preview"];

// Report Builder Features
const reportFeatures = ["Drag-and-drop sections: customer info, job details, photos, signatures", "Assign a report template when creating a job", "Version history & one-click PDF export"];

// Why PortaPro Features
const whyPortaPro = [{
  title: "Industry-Focused",
  description: "Built for portable toilet rental with features you'll use.",
  icon: CheckCircle
}, {
  title: "Affordable Plans",
  description: "Start small, scale up—no hidden fees.",
  icon: DollarSign
}, {
  title: "Friendly Support",
  description: "Email, chat, or call our team anytime.",
  icon: Heart
}];

// Pricing Package
const completePackage = {
  name: "PortaPro Complete Package",
  price: {
    monthly: 175,
    annual: 125
  },
  description: "All features included - onboarding and support included",
  features: ["Unlimited drivers and users", "Smart job wizard with multi-step creation", "Multi-site inventory tracking", "Mobile driver app with offline capability", "Custom report templates and builder", "Quote-to-job conversion flow", "Advanced analytics and reporting", "Team management and scheduling", "Stripe payment integration", "Customer portal access", "Priority email and chat support", "Full onboarding and training included"]
};
export const Landing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Load Calendly widget
  useEffect(() => {
    // Add Calendly CSS
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Add Calendly JS
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  const openCalendlyPopup = () => {
    if ((window as any).Calendly) {
      (window as any).Calendly.initPopupWidget({ url: 'https://calendly.com/portapro/portapro-software-demo' });
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 h-20 hover:h-14">
        <div className="container mx-auto px-6 h-full flex items-center justify-between max-w-6xl">
          <Logo />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors font-medium">About</a>
            <a href="#resources" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Resources</a>
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 font-medium">
                Start Free Trial
              </Button>
            </SignUpButton>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="md:hidden border-t bg-background">
            <div className="container mx-auto px-6 py-4 space-y-4">
              <nav className="space-y-2">
                <a href="#features" className="block py-2 text-muted-foreground hover:text-foreground">Features</a>
                <a href="#pricing" className="block py-2 text-muted-foreground hover:text-foreground">Pricing</a>
                <a href="#about" className="block py-2 text-muted-foreground hover:text-foreground">About</a>
                <a href="#resources" className="block py-2 text-muted-foreground hover:text-foreground">Resources</a>
              </nav>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <Button variant="ghost" className="w-full">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <Button className="w-full">Start Free Trial</Button>
                </SignUpButton>
              </div>
            </div>
          </div>}
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                
                
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  Everything You Need to Run Your Rental Business
                </h1>
                
                <p className="text-xl text-white/90 leading-relaxed">
                  From job scheduling to inventory tracking—PortaPro streamlines your day.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </SignUpButton>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10"
                  onClick={openCalendlyPopup}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Demo
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-white/30 text-white hover:bg-white/10">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Preview
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-6 pt-4 text-sm text-white/80">
                <span>• No Credit Card Required</span>
                <span>• Cancel Anytime</span>
                <span>• 30-Day Free Trial</span>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-4 transform hover:scale-105 transition-transform duration-300">
                <img src="/lovable-uploads/f6c9907a-89e5-4b5d-ac0b-7838832bd72c.png" alt="PortaPro Platform Interface" className="w-full h-auto rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feature, index) => <Card key={index} className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                  <button onClick={() => scrollToSection(feature.href.substring(1))} className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1 mx-auto">
                    Learn More <ArrowRight className="w-3 h-3" />
                  </button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Job Wizard Deep Dive */}
      <section id="job-wizard" className="py-20 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-white">
                  Powerful Job Creation—Simplified
                </h2>
                <p className="text-lg text-white/90">
                  Our 5-step wizard handles everything from customer selection to final confirmation in one smooth flow.
                </p>
              </div>
              
              <div className="space-y-4">
                {jobWizardSteps.map((step, index) => <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-white text-primary rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {step.number}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base mb-1 text-white">{step.title}</h4>
                      <p className="text-white/80 text-sm">{step.description}</p>
                    </div>
                  </div>)}
              </div>
              
              <p className="text-sm text-white/80">
                Optional partial pickups, on-site estimates, and custom report templates.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Job Creation Preview</h3>
                <div className="space-y-3">
                  {jobWizardSteps.map((step, index) => <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{step.number}</span>
                      </div>
                      <span className="text-sm font-medium">{step.title}</span>
                      <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inventory & Consumables */}
      <section id="inventory" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Real-Time Inventory, Wherever You Store It
                </h2>
                <p className="text-lg text-muted-foreground">
                  Split stock across garages or yards, see availability by date.
                </p>
              </div>
              
              <div className="space-y-4">
                {inventoryFeatures.map((feature, index) => <div key={index} className="flex items-center gap-3">
                    <feature.icon className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="font-medium">{feature.title}</span>
                  </div>)}
              </div>
            </div>
            
            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Storage Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Main Yard</span>
                  <Badge variant="secondary">85 units</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">North Depot</span>
                  <Badge variant="secondary">12 units</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">South Garage</span>
                  <Badge variant="destructive">3 units</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quote-to-Job Flow */}
      <section id="quotes" className="py-20 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                One Click from Quote to Job
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quoteFlow.map((step, index) => <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <h3 className="font-semibold">{step}</h3>
                  </CardContent>
                </Card>)}
            </div>
            
            <div className="flex items-center justify-center gap-4 pt-8">
              <div className="flex items-center gap-2 text-white/80">
                <span>Quote</span>
                <ArrowRight className="w-4 h-4" />
                <span>Customer Accepts</span>
                <ArrowRight className="w-4 h-4" />
                <span>Deposit Paid</span>
                <ArrowRight className="w-4 h-4" />
                <span>Job & Invoice Generated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team & Scheduling */}
      <section id="team" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Team Management Made Easy
                </h2>
              </div>
              
              <div className="grid gap-4">
                {teamFeatures.map((feature, index) => <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </div>)}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="font-semibold text-lg mb-4">Schedule Preview</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({
                  length: 7
                }, (_, i) => <div key={i} className="aspect-square bg-muted/50 rounded flex items-center justify-center text-sm">
                      {i + 1}
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting & Templates */}
      <section id="reports" className="py-20 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-white">
                  Custom Service Reports
                </h2>
              </div>
              
              <div className="space-y-4">
                {reportFeatures.map((feature, index) => <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white/90">{feature}</span>
                  </div>)}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="font-semibold text-lg mb-4">Report Template</h3>
              <div className="space-y-3">
                <div className="h-6 bg-muted/70 rounded"></div>
                <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="h-16 bg-muted/30 rounded"></div>
                  <div className="h-16 bg-muted/30 rounded"></div>
                </div>
                <div className="h-6 bg-muted/40 rounded mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App */}
      <section id="mobile-app" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Driver Mobile App
                </h2>
                <p className="text-lg text-muted-foreground">
                  Offline-capable interface with GPS tracking and real-time updates.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span className="font-medium">Offline Capability</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium">GPS Navigation</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium">Digital Checklists</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-medium">Real-Time Updates</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="w-48 h-96 bg-white rounded-3xl shadow-2xl p-4 relative">
                <div className="w-full h-full bg-muted/20 rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-16 h-16 text-muted-foreground" />
                </div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-muted-foreground/20 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why PortaPro */}
      <section id="about" className="py-20 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Why PortaPro
            </h2>
            
            <div className="grid sm:grid-cols-3 gap-8">
              {whyPortaPro.map((item, index) => <div key={index} className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-white">{item.title}</h3>
                  <p className="text-white/90">{item.description}</p>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-white/90">
                One complete package with everything included
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <span className={`font-medium ${!isAnnual ? 'text-white' : 'text-white/70'}`}>Monthly</span>
              <button onClick={() => setIsAnnual(!isAnnual)} className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-white' : 'bg-white/30'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${isAnnual ? 'bg-primary translate-x-7' : 'bg-white translate-x-1'}`} />
              </button>
              <span className={`font-medium ${isAnnual ? 'text-white' : 'text-white/70'}`}>
                Annual <Badge variant="secondary" className="ml-1 bg-white/20 text-white">Save $50/month</Badge>
              </span>
            </div>
            
            <div className="flex justify-center mt-12">
              <Card className="relative border-white/20 bg-white/10 backdrop-blur-sm max-w-md w-full">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-primary">
                  Complete Package
                </Badge>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white">{completePackage.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-white">
                      ${isAnnual ? completePackage.price.annual : completePackage.price.monthly}
                      <span className="text-lg font-normal text-white/80">
                        /month
                      </span>
                    </div>
                    {isAnnual && <div className="text-sm text-white/80">
                        Billed annually (${completePackage.price.annual * 12}/year) - Save $600/year
                      </div>}
                  </div>
                  <CardDescription className="text-white/90">{completePackage.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {completePackage.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-white/90">{feature}</span>
                      </li>)}
                  </ul>
                  <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <Button className="w-full bg-white text-primary hover:bg-white/90 text-lg py-6 mt-6">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </SignUpButton>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="resources" className="py-16 px-6 bg-muted/50 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#features" className="block hover:text-foreground">Features</a>
                <a href="#mobile-app" className="block hover:text-foreground">Mobile App</a>
                <a href="#" className="block hover:text-foreground">API</a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#about" className="block hover:text-foreground">About</a>
                <a href="#" className="block hover:text-foreground">Careers</a>
                <a href="#" className="block hover:text-foreground">Blog</a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground">Help Center</a>
                <a href="#" className="block hover:text-foreground">Documentation</a>
                <a href="#" className="block hover:text-foreground">Community</a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground">Terms</a>
                <a href="#" className="block hover:text-foreground">Privacy</a>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 mt-8 border-t">
            <div className="flex items-center gap-4">
              <Logo />
              <span className="text-sm text-muted-foreground">© 2024 PortaPro. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Phone className="w-4 h-4" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;