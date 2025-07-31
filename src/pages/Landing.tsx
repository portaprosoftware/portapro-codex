import React, { useState, useEffect } from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ArrowRight, Play, CheckCircle, Truck, Users, BarChart3, ClipboardList, MapPin, Calendar, DollarSign, Zap, Building2, FileText, Smartphone, Heart, Phone, Mail, Menu, X, Camera, Eye, Database, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';

// Core Features Data
const coreFeatures = [{
  title: "Google Vision AI",
  description: "Scan tool numbers and data directly from molded plastic panels.",
  icon: Camera,
  href: "#ai-scanning"
}, {
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
  name: "PortaPro Complete",
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
  const [aboutSliderOpen, setAboutSliderOpen] = useState(false);
  const [privacySliderOpen, setPrivacySliderOpen] = useState(false);

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
      (window as any).Calendly.initPopupWidget({
        url: 'https://calendly.com/portapro/portapro-software-demo?hide_event_type_details=1&hide_gdpr_banner=1'
      });
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
            <button onClick={() => setAboutSliderOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors font-medium">About</button>
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
                <button onClick={() => setAboutSliderOpen(true)} className="block py-2 text-muted-foreground hover:text-foreground text-left">About</button>
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
      <section className="min-h-screen flex items-center py-12 md:py-20 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 order-1 lg:order-1">
              <div className="space-y-6">
                
                
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  All-in-one platform for portable toilet rental companies
                </h1>
                
                <p className="text-xl text-white/90 leading-relaxed">
                  Streamline scheduling, fleet management, dispatch, invoicing, and customer communication. Everything you need to run your business efficiently in one platform.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <Button variant="outline" size="default" className="font-medium px-6 py-3 border-white/30 text-white">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </SignUpButton>
                <Button variant="outline" size="default" className="font-medium px-6 py-3 border-white/30 text-white" onClick={openCalendlyPopup}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Demo
                </Button>
                <Button variant="outline" size="default" className="font-medium px-6 py-3 border-white/30 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Preview
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-6 pt-4 text-sm text-white/80">
                <span className="font-bold">• Full Support Included</span>
                <span className="font-bold">• Cancel Anytime</span>
                <span className="font-bold">• 14 Day Free Trial</span>
              </div>
            </div>
            
            <div className="order-2 lg:order-2">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <img src="/lovable-uploads/f6c9907a-89e5-4b5d-ac0b-7838832bd72c.png" alt="PortaPro Platform Interface" className="w-full h-auto max-w-lg mx-auto lg:max-w-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why PortaPro */}
      <section id="about" className="bg-white px-0 my-[10px] py-[10px]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-12">
            
            
            <div className="grid sm:grid-cols-3 gap-8">
              {whyPortaPro.map((item, index) => <div key={index} className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 px-6 bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="container mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {coreFeatures.map((feature, index) => <Card key={index} className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/20 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm text-white/80 mb-3">{feature.description}</p>
                  <button onClick={() => scrollToSection(feature.href.substring(1))} className="text-white hover:text-white/80 text-sm font-medium flex items-center gap-1 mx-auto">
                    Learn More <ArrowRight className="w-3 h-3" />
                  </button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Smart AI Panel Scanning Section */}
      <section id="ai-scanning" className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-foreground">Smart AI Panel Scanning with Google Cloud Vision</h2>
                <p className="text-xl text-muted-foreground">
                  Eliminate manual data entry — just snap a photo.
                </p>
                <p className="text-lg text-muted-foreground">
                  PortaPro uses advanced Google Cloud Vision AI to instantly scan and extract critical molded-in data from your units, including:
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  <span className="text-foreground">Tool Numbers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  <span className="text-foreground">Vendor IDs</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  <span className="text-foreground">Plastic Type Codes (HDPE)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  </div>
                  <span className="text-foreground">Manufacturing Dates</span>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-lg font-semibold text-foreground mb-2">This isn't just OCR.</p>
                <p className="text-muted-foreground">
                  It's a purpose-built system designed for embossed plastic, trained to recognize the exact formatting used by top manufacturers like Satellite Industries.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">Why it matters:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Zap className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                    <span className="text-muted-foreground">Track every unit's origin and age instantly</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                    <span className="text-muted-foreground">Eliminate mix-ups during inspections and audits</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                    <span className="text-muted-foreground">Save hours per week on manual entry</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Camera className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                    <span className="text-muted-foreground">Boost accountability with photo-verified records</span>
                  </div>
                </div>
              </div>

              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold">
                  <Camera className="h-5 w-5" />
                  <span>Snap.</span>
                  <Eye className="h-5 w-5" />
                  <span>Scan.</span>
                  <Database className="h-5 w-5" />
                  <span>Save. That's it.</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="/lovable-uploads/0f62ebd0-b15e-44c7-8d4e-7a1a9ca96bd3.png" 
                alt="AI Panel Scanning - OCR Results showing Tool Number T-20788-V detection"
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
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
              <img 
                src="/lovable-uploads/91d616af-290f-42e4-8ff4-3a455984870c.png" 
                alt="Job Creation Wizard - Step 2 of 9: Job Type & Timezone Selection"
                className="w-full h-auto rounded-lg"
              />
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
            
            <div className="relative">
              <img 
                src="/lovable-uploads/4670748a-09ef-45f0-aed4-b594ed82994a.png" 
                alt="Real-Time Inventory Management - Products catalog with status tracking"
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
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
              <button onClick={() => setIsAnnual(!isAnnual)} className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-white/30'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${isAnnual ? 'bg-white translate-x-7' : 'bg-white translate-x-1'}`} />
              </button>
              <span className={`font-medium ${isAnnual ? 'text-white' : 'text-white/70'}`}>
                Annual <Badge variant="secondary" className={`ml-1 ${isAnnual ? 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold' : 'bg-white/20 text-white'}`}>Save $50/month</Badge>
              </span>
            </div>
            
            <div className="flex justify-center mt-12">
              <Card className="relative border-white/20 bg-white/10 backdrop-blur-sm max-w-2xl w-full">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white text-primary">
                  Complete Package
                </Badge>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white font-bold">{completePackage.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-white">
                      ${isAnnual ? completePackage.price.annual : completePackage.price.monthly}
                      <span className="text-lg font-normal text-white/80">
                        /month
                      </span>
                    </div>
                    {isAnnual && <div className="text-sm text-white/80 font-bold">
                        Billed annually (${completePackage.price.annual * 12}/year) - Save $600/year
                      </div>}
                  </div>
                  <CardDescription className="text-white/90 font-bold">{completePackage.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="grid grid-cols-2 gap-3">
                    {completePackage.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-white/90 font-bold">{feature}</span>
                      </li>)}
                  </ul>
                  <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <Button className="w-full bg-white text-primary hover:bg-white/90 text-lg py-6 mt-6 font-bold">
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
                <button onClick={() => setPrivacySliderOpen(true)} className="block hover:text-foreground text-left">Privacy</button>
                <a href="#" className="block hover:text-foreground">Security</a>
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

      {/* About Us Slider */}
      {aboutSliderOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background shadow-2xl animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-foreground">About Us</h2>
                <button 
                  onClick={() => setAboutSliderOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-6 text-center">WHO WE ARE</h3>
                    
                    <div className="space-y-6 text-lg leading-relaxed">
                      <p>
                        PortaPro is the all‑in‑one operations platform built specifically for the needs of portable‑toilet rental operators and their teams. We believe running a successful service business shouldn't require wrestling with unrelated, over‑engineered software or paper‑heavy processes. With PortaPro, you get branded, purpose‑built tools, expert resources, and hands‑on guidance to help operators of every size streamline dispatch, inventory, payments, and customer communications—so you can focus on growth, not grunt work.
                      </p>
                      
                      <p>
                        Founded in 2023, PortaPro is already trusted by hundreds of rental fleets across North America. From one‑click route planning and barcode‑driven inventory tracking to instant tap‑to‑pay and on‑demand service alerts, PortaPro bridges the gap between field efficiency and business success. Our platform empowers operators to unlock their full potential—as service professionals and entrepreneurs—by giving them software that finally works the way they do.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Slider */}
      {privacySliderOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background shadow-2xl animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-foreground">Privacy Policy</h2>
                <button 
                  onClick={() => setPrivacySliderOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8 max-w-4xl">
                  <div className="text-sm text-muted-foreground mb-4">
                    Last updated: June 11, 2025
                  </div>
                  
                  <div className="space-y-6 text-foreground">
                    <p>
                      Thank you for visiting PortaPro Software LLC ("we," "our," "us"). Protecting your privacy is important to us. This Privacy Policy explains what information we collect, why we collect it, how we use it, and how you can manage or delete your data — including specific instructions for users who sign in using Facebook Login.
                    </p>
                    
                    <p>
                      This policy applies to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>https://portaprosoftware.com and any sub-domains (the "Site")</li>
                      <li>Our web or mobile applications, dashboards, and associated services (collectively, the "Service")</li>
                    </ul>
                    
                    <p>
                      By accessing or using the Site or Service, you agree to the practices described below. If you do not agree, please do not use PortaPro Software. This policy complies with GDPR, CCPA/CPRA, and similar privacy regulations.
                    </p>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">1. Information We Collect</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-muted">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="border border-muted p-3 text-left font-semibold">Category</th>
                              <th className="border border-muted p-3 text-left font-semibold">Examples</th>
                              <th className="border border-muted p-3 text-left font-semibold">Purpose</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-muted p-3">Account Data</td>
                              <td className="border border-muted p-3">Name, business name, email, phone, mailing address, password hash</td>
                              <td className="border border-muted p-3">Create and secure your account, authenticate you</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Service Data</td>
                              <td className="border border-muted p-3">Job sites, unit IDs, driver GPS pings, photos, signatures, billing history</td>
                              <td className="border border-muted p-3">Operate routing, scheduling, invoicing, compliance logs</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Payment Data</td>
                              <td className="border border-muted p-3">Last 4 digits of card, billing ZIP, transaction IDs (processed by Stripe)</td>
                              <td className="border border-muted p-3">Process subscriptions, one-time fees, refunds</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Communications</td>
                              <td className="border border-muted p-3">Emails, SMS, support chat transcripts</td>
                              <td className="border border-muted p-3">Provide support, send alerts, improve service</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Usage Data</td>
                              <td className="border border-muted p-3">IP address, browser type, cookies, pages visited (via Google Analytics)</td>
                              <td className="border border-muted p-3">Site performance, marketing insights, security</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-sm">
                        <strong>Children's Data:</strong> PortaPro Software is not directed at children under 18. We do not knowingly collect personal data from minors.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">2. How We Use Your Information</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Provide the Service</strong> – including work-order management, routing, compliance logging, and invoicing</li>
                        <li><strong>Communications</strong> – service alerts (e.g., driver arrival) and optional marketing messages</li>
                        <li><strong>Billing</strong> – subscription management, payment processing, and fraud prevention</li>
                        <li><strong>Product improvement</strong> – feature development, analytics, bug fixes</li>
                        <li><strong>Legal obligations</strong> – enforcement of Terms, compliance with legal requests</li>
                      </ul>
                      <p className="font-semibold">We do not sell your personal information.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">3. Sharing with Third Parties</h3>
                      <p>
                        We only share data with service providers essential to delivering PortaPro Software. These parties act as data processors and follow our strict privacy requirements:
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-muted">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="border border-muted p-3 text-left font-semibold">Provider</th>
                              <th className="border border-muted p-3 text-left font-semibold">Purpose</th>
                              <th className="border border-muted p-3 text-left font-semibold">Location</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr><td className="border border-muted p-3">Supabase</td><td className="border border-muted p-3">Application database & auth</td><td className="border border-muted p-3">USA / EU</td></tr>
                            <tr><td className="border border-muted p-3">Stripe</td><td className="border border-muted p-3">Payment processing</td><td className="border border-muted p-3">USA</td></tr>
                            <tr><td className="border border-muted p-3">Twilio</td><td className="border border-muted p-3">SMS & email notifications</td><td className="border border-muted p-3">USA</td></tr>
                            <tr><td className="border border-muted p-3">Mapbox</td><td className="border border-muted p-3">Maps & routing visualizations</td><td className="border border-muted p-3">USA</td></tr>
                            <tr><td className="border border-muted p-3">Make (Integromat)</td><td className="border border-muted p-3">Workflow automation</td><td className="border border-muted p-3">EU</td></tr>
                            <tr><td className="border border-muted p-3">Google Analytics</td><td className="border border-muted p-3">IP-anonymized site analytics</td><td className="border border-muted p-3">USA</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <p>Data may also be disclosed where required by law or necessary to protect safety or rights.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">4. Cookies & Tracking</h3>
                      <p>We use:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Essential cookies:</strong> For login sessions and user security</li>
                        <li><strong>Analytics cookies:</strong> From Google Analytics for traffic and performance tracking</li>
                      </ul>
                      <p>You can disable cookies in your browser settings, though it may impact functionality.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">5. Data Retention</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Account data:</strong> Retained for the duration of your subscription and up to 7 years for audit/compliance</li>
                        <li><strong>Usage logs:</strong> Retained 30–180 days unless needed longer for security</li>
                        <li><strong>Payment data:</strong> Retained in accordance with financial and tax regulations</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">6. Data Security</h3>
                      <p>We follow industry best practices to keep your information secure:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>HTTPS encryption (TLS 1.2+)</li>
                        <li>Passwords hashed with bcrypt</li>
                        <li>Role-based access controls</li>
                        <li>24/7 monitoring and regular security reviews</li>
                      </ul>
                      <p>No system is 100% secure, but we are committed to protecting your data.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">7. Your Rights</h3>
                      <p>You may have the right to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Access your personal data</li>
                        <li>Correct or update your information</li>
                        <li>Request data deletion ("right to be forgotten")</li>
                        <li>Restrict or object to data processing</li>
                        <li>Export your data to another provider</li>
                        <li>Opt out of marketing communications</li>
                      </ul>
                      <p>To exercise these rights, email: <strong>privacy@portaprosoftware.com</strong></p>
                      <p>We will respond within 30 days.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">8. Facebook Data Deletion Instructions</h3>
                      <p>If you signed up using Facebook Login and wish to delete your data:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Visit https://portaprosoftware.com/privacy</li>
                        <li>Use the subject line: "Facebook Data Deletion Request"</li>
                        <li>Include the email address linked to your Facebook account</li>
                      </ul>
                      <p>We will verify your request and delete all associated data from our systems within 7 business days. You'll receive confirmation once complete.</p>
                      <p>You can also send your request directly to <strong>privacy@portaprosoftware.com</strong>.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">9. International Transfers</h3>
                      <p>We host data in the United States. Where applicable, we use Standard Contractual Clauses (SCCs) or similar lawful mechanisms to facilitate transfers from the EU or UK.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">10. Changes to This Policy</h3>
                      <p>This Privacy Policy may be updated periodically. If we make material changes, we'll notify you via email or on our website. The "Last updated" date above reflects the latest version.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">11. Contact Us</h3>
                      <div className="space-y-2">
                        <p><strong>📧 Email:</strong> privacy@portaprosoftware.com</p>
                        <p><strong>📬 Mailing Address:</strong></p>
                        <div className="ml-4">
                          <p>PortaPro Software LLC</p>
                          <p>1055 Old River Road, Unit 721</p>
                          <p>Cleveland, OH 44113</p>
                          <p>USA</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>;
};
export default Landing;