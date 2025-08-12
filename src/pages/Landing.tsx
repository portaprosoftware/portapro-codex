import React, { useState, useEffect } from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ArrowRight, Play, CheckCircle, Truck, Users, BarChart3, ClipboardList, MapPin, Calendar, DollarSign, Zap, Building2, FileText, Smartphone, Heart, Phone, Mail, Menu, X, Camera, Eye, Database, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import { BlogSlider } from '@/components/BlogSlider';
import { AutoCarousel } from '@/components/ui/AutoCarousel';
import { FloatingActionButton } from '@/components/ui/floating-action-button';

// Import demo images
import demoAiScanning from '@/assets/demo-ai-scanning.jpg';
import demoJobWizard from '@/assets/demo-job-wizard.jpg';
import demoInventory from '@/assets/demo-inventory.jpg';
import demoQuotes from '@/assets/demo-quotes.jpg';
import demoMobileApp from '@/assets/demo-mobile-app.jpg';
import demoTeamManagement from '@/assets/demo-team-management.jpg';
// Core Features - Section 1 (Blue background)
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

// Management Features - Section 2 (White background)
const managementFeatures = [{
  title: "Fleet Management",
  description: "Track vehicles, fuel, maintenance schedules, and driver assignments.",
  icon: Truck,
  href: "#fleet-management"
}, {
  title: "Team Management",
  description: "Schedule crews, track time, and manage roles and permissions.",
  icon: Users,
  href: "#team-management"
}, {
  title: "Customer Dashboard",
  description: "Self-service portal for customers to manage orders and track deliveries.",
  icon: Users,
  href: "#customer-portal"
}, {
  title: "Analytics Dashboard",
  description: "Real-time insights into revenue, fleet utilization, and performance metrics.",
  icon: BarChart3,
  href: "#analytics"
}];

// Services & Operations - Section 3 (Blue background)
const servicesFeatures = [{
  title: "Inventory & Supplies",
  description: "Track units and consumables across multiple storage sites.",
  icon: Building2,
  href: "#inventory"
}, {
  title: "Consumables",
  description: "Manage toilet paper, sanitizer, and cleaning supplies inventory.",
  icon: FileText,
  href: "#consumables"
}, {
  title: "Services Hub",
  description: "Coordinate pumping, cleaning, and maintenance service operations.",
  icon: Zap,
  href: "#services-hub"
}, {
  title: "Marketing Tools",
  description: "Customer communication, promotions, and lead generation features.",
  icon: Eye,
  href: "#marketing"
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
  title: "Consumables & Supplies Management",
  icon: Building2
}, {
  title: "Multi-Location Stock Allocation",
  icon: MapPin
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
  description: "All features, onboarding and support included",
  features: ["Unlimited drivers and users", "Multi-Step Job Creation Wizard", "Multi-site inventory tracking", "Mobile driver app with offline capability", "Custom report templates and builder", "Quote-to-job conversion flow", "Advanced analytics and reporting", "Team management and scheduling", "Stripe payment integration", "Customer portal access", "Priority email and chat support", "Full onboarding and training included"]
};
export const Landing: React.FC = () => {
  // Image arrays for carousels
  const aiPanelImages = ['/lovable-uploads/0aaf6ddd-b2a4-4d47-bbda-6a1a4cd07b9a.png'];
  const googleAIImages = ['/lovable-uploads/88fecdfc-2af8-411d-be32-c0d6de398a59.png'];
  const jobWizardImages = ['/lovable-uploads/000da128-8181-457e-85c7-8dcbc26734ee.png', '/lovable-uploads/0ac8d222-a55d-4abc-aab0-e9b34dc983e5.png', '/lovable-uploads/baad8a96-f346-4808-bd4b-641dc717fb89.png'];
  const inventoryImages = ['/lovable-uploads/4f491786-7f7a-4dc3-bb83-a919b928c766.png', '/lovable-uploads/b9ab637c-b429-4038-be9d-f8f3b5f6a4eb.png', '/lovable-uploads/540cf6a3-2a5b-465b-ac69-ca6f4645a265.png'];
  const teamImages = ['/lovable-uploads/12ff3d89-29f4-46b2-810b-d4cf0d3d9ca3.png', '/lovable-uploads/512cf733-6eb4-4b1d-9a9c-46787e6e86d6.png', '/lovable-uploads/5e758ed0-03a4-40d8-8ece-677fe1fb285a.png'];
  const reportingImages = ['/lovable-uploads/269955d2-a4f5-41ed-aaa3-3c93d6e096c4.png', '/lovable-uploads/62459b5d-e91c-4b88-8e19-55e991482602.png'];
  const mobileImages = ['/lovable-uploads/298c7157-c616-403a-9832-ad5279814883.png', '/lovable-uploads/df397e89-fe41-4640-9f41-42a976d4bb25.png'];
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutSliderOpen, setAboutSliderOpen] = useState(false);
  const [privacySliderOpen, setPrivacySliderOpen] = useState(false);
  const [securitySliderOpen, setSecuritySliderOpen] = useState(false);
  const [termsSliderOpen, setTermsSliderOpen] = useState(false);
  const [communitySliderOpen, setCommunitySliderOpen] = useState(false);
  const [blogSliderOpen, setBlogSliderOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [questionsFormOpen, setQuestionsFormOpen] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<string | null>(null);

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
  return <div id="top" className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 h-14">
        <div className="container mx-auto px-12 h-full flex items-center justify-between max-w-full">
          <Logo />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 ml-auto mr-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Pricing</a>
            <button onClick={() => setQuestionsFormOpen(true)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Contact</button>
            <a href="#tour" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Watch Tour</a>
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <a href="https://accounts.portaprosoftware.com/sign-in" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="text-sm font-medium shadow-none hover:shadow-none">Sign In</Button>
            </a>
            <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-blue text-white text-sm font-medium">
                Start Free Trial
              </Button>
            </a>
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
                <a href="#features" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Features</a>
                <a href="#pricing" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Pricing</a>
                <button onClick={() => setQuestionsFormOpen(true)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Contact</button>
                <a href="#tour" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Watch Tour</a>
              </nav>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <a href="https://accounts.portaprosoftware.com/sign-in" target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" className="w-full text-sm font-medium shadow-none hover:shadow-none">Sign In</Button>
                </a>
                <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full text-sm font-medium">Start Free Trial</Button>
                </a>
              </div>
            </div>
          </div>}
      </header>

      {/* Sticky CTA Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={() => window.open('https://accounts.portaprosoftware.com/sign-up', '_blank')} className="bg-gradient-blue text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          Start Free Trial
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Hero Section - Blue */}
      <section className="py-4 md:py-6 bg-gradient-blue text-white">
        <div className="container mx-auto max-w-full px-12 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-8xl mx-auto">
            <div className="space-y-4">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                  All-in-one platform for portable toilet rental companies
                </h1>
                
                <p className="text-lg lg:text-xl text-white/90 leading-relaxed">
                  Streamline scheduling, fleet management, dispatch, invoicing, and customer communication. Everything you need to run your business efficiently in one platform.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="default" className="font-medium px-6 py-3 border-white/30 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <Button variant="outline" size="default" className="font-medium px-6 py-3 border-white/30 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200" onClick={openCalendlyPopup}>
                  Schedule Demo
                  <Calendar className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="default" className="font-medium px-6 py-3 border-white/30 text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  Watch 60-second tour
                  <Play className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-6 flex-wrap opacity-90">
                  <span className="text-white/80 text-sm">Trusted by operators across North America</span>
                </div>
                <div className="flex flex-wrap gap-6 pt-2 text-sm text-white/80">
                  <span className="font-bold text-base">• Full Support Included</span>
                  <span className="font-bold text-base">• Cancel Anytime</span>
                  <span className="font-bold text-base">• 14 Day Free Trial</span>
                </div>
              </div>
            </div>
            
            <div>
              <img src="/lovable-uploads/0b9e4b76-5c94-4466-b77f-93a65d668f43.png" alt="PortaPro Dashboard Preview" loading="lazy" decoding="async" className="w-full max-w-3xl mx-auto lg:max-w-none transform scale-[1.0125]" />
            </div>
          </div>
        </div>
      </section>

      {/* Why PortaPro - White */}
      <section id="about" className="py-2 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center space-y-8">
            <div className="grid sm:grid-cols-3 gap-8">
              {whyPortaPro.map((item, index) => (
                <div key={index} className="text-center space-y-2">
                  <h3 className="font-semibold text-lg text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Group 1: Core Features - Blue */}
      <section id="features" className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Core Workflow Features</h2>
            <p className="text-white/80 text-lg">Essential tools to get your business running efficiently</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/10 backdrop-blur border-white/20">
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections for Group 1: Core Features */}

      {/* Smart AI Panel Scanning Section - White */}
      <section id="ai-scanning" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <Card className="p-8">
            {/* Top Row: Image */}
            <div className="mb-8">
              <div className="relative">
                <img src={demoAiScanning} alt="AI Scanning Demo - Google Vision AI Interface" className="w-full rounded-2xl shadow-lg" />
              </div>
            </div>

            {/* Middle Row: Header and Why it matters */}
            <div className="grid lg:grid-cols-2 gap-12 items-start mb-8">
              <div className="space-y-6">
                <div className="space-y-4">
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

              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">Why it matters:</h3>
                <div className="space-y-4">
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
            </div>

            {/* Bottom Row: OCR Box */}
            <div className="flex justify-center">
              <div className="bg-gray-50 p-6 rounded-lg max-w-2xl">
                <p className="text-lg font-semibold text-foreground mb-2">This isn't just OCR.</p>
                <p className="text-muted-foreground">
                  It's a purpose-built system designed for embossed plastic, trained to recognize the exact formatting used by top manufacturers like Satellite Industries.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Job Wizard Deep Dive - Blue */}
      <section id="job-wizard" className="py-8 bg-gradient-blue text-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
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
              <img src={demoJobWizard} alt="Job Wizard Demo - Step-by-step Job Creation Interface" className="w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Quote-to-Job Flow - White */}
      <section id="quotes" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <Card className="p-8">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  One Click from Quote to Job
                </h2>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {quoteFlow.map((step, index) => <Card key={index} className="text-center">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{index + 1}</span>
                      </div>
                      <h3 className="font-semibold text-foreground">{step}</h3>
                    </CardContent>
                  </Card>)}
              </div>
              
              <div className="flex items-center justify-center gap-4 pt-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Quote</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>Customer Accepts</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>Deposit Paid</span>
                  <ArrowRight className="w-4 h-4" />
                  <span>Job & Invoice Generated</span>
                </div>
              </div>
              
              <div className="mt-8">
                <img src={demoQuotes} alt="Quote-to-Job Demo - Customer Portal and Payment Integration" className="w-full max-w-4xl mx-auto rounded-2xl shadow-lg" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Driver Mobile App - Blue */}
      <section id="mobile-app" className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-white">
                  Driver Mobile App - Works Offline
                </h2>
                <p className="text-lg text-white/90">
                  Native mobile app with GPS navigation, photo upload, and digital checklists that work even without signal.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-white/90">Offline-capable route navigation</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-white/90">Photo documentation with GPS stamps</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-white/90">Digital delivery confirmations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-white/90">Real-time job status updates</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-6">
              <img src={demoMobileApp} alt="Mobile App Demo - Driver Interface" className="w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Group 2: Management Features - Blue */}
      <section className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Management Features</h2>
            <p className="text-white/80 text-lg">Advanced tools for fleet, team, and business management</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {managementFeatures.map((feature, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/10 backdrop-blur border-white/20">
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections for Group 2: Management Features */}

      {/* Fleet Management (includes Transport & Spill Compliance + DVIRs) - White */}
      <section id="fleet-management" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Fleet Management & Compliance</h2>
            <p className="text-lg text-muted-foreground">Complete vehicle tracking, maintenance, and compliance management</p>
          </div>

          {/* Transport & Spill Compliance */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">Transport & Spill Compliance Suite</h3>
              <p className="text-lg text-muted-foreground">Stay audit-ready with structured logs and document tracking.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Transport manifests & chain-of-custody</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Spill incidents with photos, notes, and follow-ups</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Auto reminders for expiring documents</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-md">
              <AutoCarousel media={[]} className="w-full" aspectRatio="aspect-[4/3]" />
            </div>
          </div>

          {/* DVIRs & Maintenance */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">DVIRs & Fleet Maintenance</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Pre/Post-trip DVIR checklists</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Maintenance logs and alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Driver photos and signatures</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-md">
              <AutoCarousel media={[]} className="w-full" aspectRatio="aspect-[4/3]" />
            </div>
          </div>
        </div>
      </section>

      {/* Team Management - Blue */}
      <section id="team-management" className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-white">
                  Team Management Made Easy
                </h2>
                <p className="text-lg text-white/90">
                  Coordinate your crew with smart scheduling and role management.
                </p>
              </div>
              
              <div className="grid gap-4">
                {teamFeatures.map((feature, index) => <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                    <span className="font-medium text-white/90">{feature}</span>
                  </div>)}
              </div>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-6">
              <img src={demoTeamManagement} alt="Team Management Demo - Scheduling and Roles Interface" className="w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Dashboard - White */}
      <section id="customer-portal" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Customer Dashboard</h2>
              <p className="text-lg text-muted-foreground">Self-service portal for customers to manage orders and track deliveries.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Order tracking and history</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Real-time delivery updates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Invoice access and payment portal</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Service request submissions</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-md">
              <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Customer Dashboard Preview Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Dashboard - Blue */}
      <section id="analytics" className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-lg text-white/90">Real-time insights into revenue, fleet utilization, and performance metrics.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Revenue tracking and forecasting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Fleet utilization reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Customer analytics and insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Performance benchmarking</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="bg-white/20 h-64 rounded-lg flex items-center justify-center">
                <p className="text-white/70">Analytics Dashboard Preview Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Group 3: Operations Features - Blue */}
      <section className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Operations Features</h2>
            <p className="text-white/80 text-lg">Comprehensive tools for inventory, services, and customer engagement</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesFeatures.map((feature, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/10 backdrop-blur border-white/20">
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
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections for Group 3: Operations Features */}

      {/* Inventory & Supplies - White */}
      <section id="inventory" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <Card className="p-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
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
                <img src={demoInventory} alt="Inventory Management Demo - Multi-location Tracking Interface" className="w-full rounded-2xl shadow-lg" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Inventory & Consumables - White */}
      <section id="inventory" className="py-16 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
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
              <img src={demoInventory} alt="Inventory Management Demo - Multi-location Tracking Interface" className="w-full rounded-2xl shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Consumables - Blue */}
      <section id="consumables" className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">Consumables Management</h2>
              <p className="text-lg text-white/90">Manage toilet paper, sanitizer, and cleaning supplies inventory.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Automated inventory tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Reorder alerts and suggestions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Usage analytics and forecasting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Supplier management and pricing</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="bg-white/20 h-64 rounded-lg flex items-center justify-center">
                <p className="text-white/70">Consumables Management Preview Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Hub - White */}
      <section id="services-hub" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Services Hub</h2>
              <p className="text-lg text-muted-foreground">Coordinate pumping, cleaning, and maintenance service operations.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Service scheduling and dispatch</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Maintenance tracking and history</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Service quality documentation</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Customer service communications</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-md">
              <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Services Hub Preview Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Tools - Blue */}
      <section id="marketing" className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">Marketing Tools</h2>
              <p className="text-lg text-white/90">Customer communication, promotions, and lead generation features.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Email campaign management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Customer segmentation and targeting</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Promotional code management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">Lead tracking and conversion</span>
                </li>
              </ul>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <div className="bg-white/20 h-64 rounded-lg flex items-center justify-center">
                <p className="text-white/70">Marketing Tools Preview Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting & Templates - White */}
      <section id="reports" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Custom Service Reports
                </h2>
              </div>
              
              <div className="space-y-4">
                {reportFeatures.map((feature, index) => <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </div>)}
              </div>
            </div>
            
            <div>
              <AutoCarousel media={reportingImages} className="w-full" aspectRatio="aspect-[4/3]" />
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t border-border"></div>
        </div>
      </div>

      {/* Mobile App - White */}
      <section id="mobile-app" className="py-16 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
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
            
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="flex justify-center">
                <img src={demoMobileApp} alt="Mobile Driver App Demo - Route Navigation and Job Updates" className="w-full max-w-sm rounded-2xl shadow-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing - Blue */}
      <section id="pricing" className="py-4 bg-gradient-blue text-white">
        <div className="container mx-auto max-w-6xl px-6">
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
              <Card className="relative border-gray-300/50 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 shadow-2xl shadow-gray-900/10 max-w-2xl w-full backdrop-blur-sm ring-1 ring-gray-300/50">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-gray-500/20 rounded-lg"></div>
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                  Complete Package
                </Badge>
                <CardHeader className="text-center relative z-10">
                  <CardTitle className="text-2xl text-gray-900 font-bold">{completePackage.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-gray-900">
                      ${isAnnual ? completePackage.price.annual : completePackage.price.monthly}
                      <span className="text-lg font-normal text-gray-600">
                        /month
                      </span>
                    </div>
                     {isAnnual && <div className="text-sm text-gray-700 font-bold">
                        Billed annually (${(completePackage.price.annual * 12).toLocaleString()}/year) - Save $600/year
                      </div>}
                  </div>
                  <CardDescription className="text-gray-700 font-bold">{completePackage.description}</CardDescription>
                </CardHeader>
                <div className="mt-0 mb-4 flex items-center justify-center gap-3 relative z-10">
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">14-day trial</Badge>
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">Full support included</Badge>
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">No contracts required</Badge>
                </div>
                <CardContent className="space-y-4 relative z-10">
                  <ul className="grid grid-cols-2 gap-3">
                    {completePackage.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-800 font-medium">{feature}</span>
                      </li>)}
                  </ul>
                  <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 text-lg py-6 mt-6 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* In action: 60-second tour - White */}
      <section id="tour" className="py-4 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">See PortaPro in Action</h2>
              <p className="text-lg text-muted-foreground">A quick 60-second overview of the job wizard, driver app, and quote-to-job flow.</p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-md border bg-card">
              <video className="w-full aspect-video" muted loop playsInline preload="metadata" poster="/placeholder.svg">
                {/* You can replace the source below with your real tour video */}
                <source src="" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer id="resources" className="py-16 px-6 bg-gradient-blue text-white border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Product</h4>
              <div className="space-y-2 text-sm text-white/80">
                <a href="#features" className="block hover:text-white">Features</a>
                <a href="#mobile-app" className="block hover:text-white">Mobile App</a>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Company</h4>
              <div className="space-y-2 text-sm text-white/80">
                <button onClick={() => setAboutSliderOpen(true)} className="block hover:text-white text-left">About</button>
                <a href="#" className="block hover:text-white">Careers</a>
                <button onClick={() => setBlogSliderOpen(true)} className="block hover:text-white text-left">Blog</button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Resources</h4>
              <div className="space-y-2 text-sm text-white/80">
                <a href="/help" className="block hover:text-white">Help Center</a>
                <button onClick={() => setCommunitySliderOpen(true)} className="block hover:text-white text-left">Community</button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Legal</h4>
              <div className="space-y-2 text-sm text-white/80">
                <button onClick={() => setTermsSliderOpen(true)} className="block hover:text-white text-left">Terms</button>
                <button onClick={() => setPrivacySliderOpen(true)} className="block hover:text-white text-left">Privacy</button>
                <button onClick={() => setSecuritySliderOpen(true)} className="block hover:text-white text-left">Security</button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 mt-8 border-t">
            <div className="flex items-center gap-4">
              <Logo variant="footer" />
              <span className="text-sm text-white/80">© 2025 PortaPro. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <div className="flex items-center gap-2 text-white/80">
                <Phone className="w-4 h-4" />
                <a href="tel:+12164123239" className="hover:text-white transition-colors">
                  (216) 412-3239
                </a>
              </div>
              <button onClick={() => setContactFormOpen(true)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span>Contact Us</span>
              </button>
              <button onClick={() => scrollToSection('top')} className="text-white/80 hover:text-white transition-colors">
                ↑ Back to top
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* About Us Slider */}
      {aboutSliderOpen && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background shadow-2xl animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-foreground">About Us</h2>
                <button onClick={() => setAboutSliderOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
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
                        Founded in <strong>2025</strong>, PortaPro is already trusted by rental fleets across North America. From one‑click route planning and barcode‑driven inventory tracking to instant tap‑to‑pay and on‑demand service alerts, PortaPro bridges the gap between field efficiency and business success. Our platform empowers operators to unlock their full potential—as service professionals and entrepreneurs—by giving them software that finally works the way they do.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {/* Privacy Policy Slider */}
      {privacySliderOpen && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background shadow-2xl animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-foreground">Privacy Policy</h2>
                <button onClick={() => setPrivacySliderOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
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
        </div>}

      {/* Security Center Slider */}
      {securitySliderOpen && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background shadow-2xl animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-foreground">Security Center</h2>
                <button onClick={() => setSecuritySliderOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8 max-w-4xl">
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong>Security Center</strong><br />
                    <em>Last updated: August 1, 2025</em>
                  </div>
                  
                  <div className="space-y-6 text-foreground">
                    <p>
                      We know your route data, customer records, and payment details are mission-critical. Below you'll find a transparent overview of how PortaPro Software LLC ("PortaPro," "we") keeps that information safe.
                    </p>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">1. Security-First Culture</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Dedicated security champion</strong> on every sprint—no feature ships without passing our security checklist.</li>
                        <li><strong>Mandatory training</strong>: Annual OWASP Top 10 & social-engineering courses for all employees.</li>
                        <li><strong>Least-privilege access</strong>: Staff accounts are provisioned on a "need-to-know" basis and reviewed quarterly.</li>
                      </ul>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">2. Infrastructure & Hosting</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-muted">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="border border-muted p-3 text-left font-semibold">Component</th>
                              <th className="border border-muted p-3 text-left font-semibold">Provider</th>
                              <th className="border border-muted p-3 text-left font-semibold">Controls in Place</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-muted p-3">Application & DB</td>
                              <td className="border border-muted p-3">Supabase (Postgres)</td>
                              <td className="border border-muted p-3">VPC isolation · Automated patching · Daily encryption-verified backups</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">File storage</td>
                              <td className="border border-muted p-3">Supabase Storage (S3-compatible)</td>
                              <td className="border border-muted p-3">Server-side AES-256 encryption · Signed-URL access</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Authentication</td>
                              <td className="border border-muted p-3">Clerk (Auth)</td>
                              <td className="border border-muted p-3">JWT-based auth · Role claims · Multi-factor support</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Map & routing</td>
                              <td className="border border-muted p-3">Mapbox</td>
                              <td className="border border-muted p-3">HTTPS API calls · No PII logged</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Automations</td>
                              <td className="border border-muted p-3">Make (EU data center)</td>
                              <td className="border border-muted p-3">TLS 1.2+ · Role-limited API keys</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Payments</td>
                              <td className="border border-muted p-3">Stripe</td>
                              <td className="border border-muted p-3">PCI-DSS Level 1 · PortaPro never stores full card data</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p>All production services run in hardened Kubernetes clusters within Tier 3/4 data centers in the U.S. and EU.</p>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">3. Data Encryption</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>In transit</strong>: TLS 1.2+ for 100% of traffic—including internal service calls.</li>
                        <li><strong>At rest</strong>: AES-256 for databases, object storage, and backups.</li>
                        <li><strong>Password storage</strong>: bcrypt with unique 12-byte salt, work factor ≥ 12.</li>
                      </ul>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">4. Identity & Access Management</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Auth methods</strong>: Email/password, Google OAuth, or SSO (SAML 2.0) on request.</li>
                        <li><strong>MFA</strong>: TOTP & WebAuthn supported for all admin users; recommended for everyone.</li>
                        <li><strong>Session controls</strong>: Access tokens expire after 1 hr; refresh tokens rotate every 24 hrs or on sign-out.</li>
                      </ul>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">5. Application Security</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Secure SDLC</strong>: Static analysis (Snyk) on every pull request; nightly dependency scanning.</li>
                        <li><strong>Penetration tests</strong>: Independent CREST-certified team twice per year; summary available under NDA.</li>
                        <li><strong>Bug bounty</strong>: Public program on HackerOne with rewards for verified vulnerabilities.</li>
                        <li><strong>Content Security Policy</strong>: Strict CSP headers; only whitelisted third-party scripts allowed.</li>
                      </ul>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">6. Network & Monitoring</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>WAF & DDoS protection</strong> via Cloudflare.</li>
                        <li><strong>24×7 log aggregation</strong> into Datadog with anomaly alerts (MTTD {"<"} 5 min).</li>
                        <li><strong>Egress allow-listing</strong>: Only required ports/protocols open to vendor IPs.</li>
                        <li><strong>Audit trails</strong>: Immutable logs retained 12 months; critical actions double-logged.</li>
                      </ul>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">7. Backup & Disaster Recovery</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-muted">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="border border-muted p-3 text-left font-semibold">Item</th>
                              <th className="border border-muted p-3 text-left font-semibold">Frequency</th>
                              <th className="border border-muted p-3 text-left font-semibold">Retention</th>
                              <th className="border border-muted p-3 text-left font-semibold">Restore SLA</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-muted p-3">Postgres snapshots</td>
                              <td className="border border-muted p-3">Hourly</td>
                              <td className="border border-muted p-3">35 days</td>
                              <td className="border border-muted p-3">{"<"} 30 min</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Full encrypted backup</td>
                              <td className="border border-muted p-3">Nightly</td>
                              <td className="border border-muted p-3">7 years (cold storage)</td>
                              <td className="border border-muted p-3">{"<"} 12 hrs</td>
                            </tr>
                            <tr>
                              <td className="border border-muted p-3">Configuration state</td>
                              <td className="border border-muted p-3">Continuous (Git)</td>
                              <td className="border border-muted p-3">Indefinite</td>
                              <td className="border border-muted p-3">Immediate</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p>Quarterly restore drills validate backup integrity.</p>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">8. Compliance & Privacy</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>GDPR / UK DPA 2018</strong>: Standard contractual clauses (SCCs) for EU transfers.</li>
                        <li><strong>CCPA/CPRA</strong>: Data Processing Addendum available.</li>
                        <li><strong>SOC 2 Type II</strong>: Audit in progress, target report Q4 2025.</li>
                        <li><strong>PCI-DSS</strong>: Delegated to Stripe (Level 1).</li>
                      </ul>
                      <p>See our Privacy Policy for full data-handling details.</p>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">9. Incident Response</h3>
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li><strong>Detect</strong> – Real-time alerts into PagerDuty.</li>
                        <li><strong>Contain</strong> – Access revoked or firewall rules adjusted within 15 min.</li>
                        <li><strong>Investigate</strong> – Forensic logs preserved; root-cause analysis initiated.</li>
                        <li><strong>Notify</strong> – Affected customers informed within 72 hrs (sooner if required).</li>
                        <li><strong>Remediate & Review</strong> – Internal post-mortem; controls updated.</li>
                      </ol>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">10. Responsible Disclosure</h3>
                      <p>
                        Found a vulnerability? Email <strong><a href="mailto:security@portaprosoftware.com" className="text-primary hover:underline">security@portaprosoftware.com</a></strong> or submit via our HackerOne page. We'll acknowledge within 24 hrs and keep you informed throughout remediation. Good-faith reports are never subject to legal action.
                      </p>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">11. Your Security Controls</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>Enable MFA</strong> for all users: <em>Admin → Settings → Security</em>.</li>
                        <li><strong>Rotate API keys</strong> every 90 days.</li>
                        <li><strong>Set role permissions</strong> so drivers only access today's jobs.</li>
                        <li><strong>Use webhooks</strong> with HMAC validation for outbound data.</li>
                      </ul>
                    </div>
                    
                    <hr className="border-muted my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">12. Contact</h3>
                      <div className="space-y-2">
                        <p><strong>PortaPro Software LLC</strong></p>
                        <p>1055 Old River Road, Unit 721</p>
                        <p>Cleveland, OH 44113, USA</p>
                        <p>📧 <a href="mailto:security@portaprosoftware.com" className="text-primary hover:underline">security@portaprosoftware.com</a></p>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        We continuously evolve our controls. Any material changes to this Security Center will be posted here and, when significant, emailed to account administrators.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {/* Terms of Service Slider */}
      {termsSliderOpen && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background shadow-2xl animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-foreground">Terms of Service</h2>
                <button onClick={() => setTermsSliderOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
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
                      Welcome to PortaPro ("PortaPro," "we," "our," "us"). These Terms of Service ("Terms") govern your access to and use of:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>portapro.app and any sub‑domains (the "Site"), and</li>
                      <li>our web or mobile applications, dashboards, APIs, and related services (collectively, the "Service").</li>
                    </ul>
                    <p>
                      By creating an account, signing an order form, or otherwise using the Service, you agree to be bound by these Terms and by our Privacy Policy (together, the "Agreement"). If you do not agree, do not access or use PortaPro.
                    </p>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">1. Eligibility & Account Registration</h3>
                      <div className="space-y-2">
                        <p><strong>1.1 Business use.</strong> The Service is intended for lawful business purposes only. You must be at least 18 years old and authorized to bind your company to this Agreement.</p>
                        <p><strong>1.2 Accurate information.</strong> You agree to provide and maintain accurate, current, and complete account information, including a valid email address.</p>
                        <p><strong>1.3 Credentials.</strong> Keep your login credentials confidential. You are responsible for all activity that occurs under your account.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">2. Subscriptions & Fees</h3>
                      <div className="space-y-2">
                        <p><strong>2.1 Plans.</strong> Features, user limits, SMS quotas, and support levels vary by the subscription plan you select (the "Plan").</p>
                        <p><strong>2.2 Billing.</strong> Fees are charged in advance on a monthly or annual basis via Stripe. By adding a payment method, you authorize us to charge all applicable fees and taxes.</p>
                        <p><strong>2.3 Auto‑renewal.</strong> Plans renew automatically unless canceled at least 5 days before the end of the current term.</p>
                        <p><strong>2.4 Late payments.</strong> Overdue amounts may accrue interest at 1.5% per month (or the maximum allowed by law). We may suspend access for non‑payment.</p>
                        <p><strong>2.5 No refunds.</strong> Except as required by law or expressly stated in an order form, all payments are non‑refundable.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">3. Permitted Use & Restrictions</h3>
                      <div className="space-y-2">
                        <p><strong>3.1 License.</strong> We grant you a limited, non‑exclusive, non‑transferable license to use the Service during your active subscription.</p>
                        <p><strong>3.2 Prohibited conduct.</strong> You shall not:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>a. Reverse‑engineer, decompile, or disassemble any part of the Service;</li>
                          <li>b. Circumvent rate limits or security features;</li>
                          <li>c. Use the Service to transmit spam, illegal content, or personal data of minors;</li>
                          <li>d. Use automated systems to scrape or download data except through our published APIs;</li>
                          <li>e. Misrepresent your affiliation with PortaPro.</li>
                        </ul>
                        <p><strong>3.3 Compliance.</strong> You are solely responsible for complying with all applicable laws and regulations (e.g., DOT, OSHA, GDPR, CCPA) in connection with your use of the Service.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">4. Customer Data & Privacy</h3>
                      <div className="space-y-2">
                        <p><strong>4.1 Ownership.</strong> "Customer Data" means all data (including job sites, GPS logs, photos, customer lists) submitted to the Service by you or on your behalf. You retain all rights in Customer Data except the limited rights granted herein.</p>
                        <p><strong>4.2 License to us.</strong> You grant PortaPro a worldwide, non‑exclusive license to host, copy, process, transmit, and display Customer Data solely to provide, secure, and improve the Service.</p>
                        <p><strong>4.3 Privacy.</strong> Our collection and use of personal information is described in the PortaPro Privacy Policy, which is incorporated by reference.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">5. Intellectual Property</h3>
                      <div className="space-y-2">
                        <p><strong>5.1 PortaPro IP.</strong> All software, trademarks, designs, and content provided by PortaPro are the exclusive property of PortaPro Software LLC or its licensors.</p>
                        <p><strong>5.2 Feedback.</strong> Suggestions or feedback you provide may be used by us without restriction or compensation.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">6. Third‑Party Services</h3>
                      <p>The Service integrates with third‑party platforms (e.g., Stripe, Twilio, Mapbox). Your use of such services is subject to their separate terms. PortaPro is not responsible for third‑party services or acts.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">7. Confidentiality</h3>
                      <p>Each party agrees to protect the other's non‑public information ("Confidential Information") with at least reasonable care and to use it solely to fulfill its obligations under these Terms.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">8. Disclaimers</h3>
                      <p className="text-sm font-semibold uppercase">
                        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." EXCEPT AS EXPRESSLY SET OUT HEREIN, PORTAPRO MAKES NO WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON‑INFRINGEMENT. MAP DATA AND ROUTING RESULTS MAY CONTAIN ERRORS; YOU ASSUME ALL RISK FOR RELIANCE ON SUCH OUTPUT.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">9. Limitation of Liability</h3>
                      <p className="text-sm font-semibold uppercase">
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, PORTAPRO'S TOTAL LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE FEES YOU PAID TO PORTAPRO IN THE 12 MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM. IN NO EVENT SHALL PORTAPRO BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR GOODWILL.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">10. Indemnification</h3>
                      <p>You will indemnify and hold harmless PortaPro, its officers, directors, and employees from any claims, damages, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your misuse of the Service, (b) Customer Data, or (c) violation of these Terms.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">11. Term & Termination</h3>
                      <div className="space-y-2">
                        <p><strong>11.1 Term.</strong> These Terms take effect when you first use the Service and continue until terminated.</p>
                        <p><strong>11.2 Termination by you.</strong> Cancel via your account settings or by written notice to support@portapro.app.</p>
                        <p><strong>11.3 Termination by us.</strong> We may suspend or terminate the Service immediately if you breach these Terms or pose a security or legal risk.</p>
                        <p><strong>11.4 Data export.</strong> Upon termination, you may export Customer Data for 30 days; afterward, we may delete it per our Data Retention Policy.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">12. Changes to the Service or Terms</h3>
                      <p>We may modify the Service or these Terms at any time. Material changes will be posted on the Site or emailed to your admin contact 30 days before they take effect. Continued use after that date constitutes acceptance.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">13. Governing Law & Dispute Resolution</h3>
                      <p>These Terms are governed by the laws of the State of Ohio, USA, without regard to conflicts‑of‑law principles. Any dispute not resolved informally shall be submitted to binding arbitration in Cleveland, OH under the Commercial Arbitration Rules of the American Arbitration Association. Each party waives the right to a jury trial and to participate in class actions.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">14. Export & Compliance</h3>
                      <p>You may not use the Service in violation of U.S. export laws or regulations or in countries embargoed by the United States.</p>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">15. General</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Entire agreement.</strong> This Agreement supersedes all prior proposals or agreements.</li>
                        <li><strong>Severability.</strong> If any provision is unenforceable, the remainder remains in effect.</li>
                        <li><strong>Assignment.</strong> You may not assign these Terms without our consent; we may assign in connection with a merger or sale of assets.</li>
                        <li><strong>No waiver.</strong> Failure to enforce a provision is not a waiver of future enforcement.</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold">16. Contact</h3>
                      <div className="space-y-2">
                        <p>PortaPro Software LLC</p>
                        <p>1055 Old River Road, Unit 721</p>
                        <p>Cleveland, OH 44113, USA</p>
                        <p><strong>📧</strong> legal@portaprosoftware.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {/* Community Slider */}
      {communitySliderOpen && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-full max-w-4xl bg-background shadow-2xl animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-foreground">🚀 Join the PortaPro Community</h2>
                <button onClick={() => setCommunitySliderOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8 max-w-4xl">
                  <div className="text-center">
                    <p className="text-lg text-muted-foreground">
                      Where modern sanitation pros connect, learn, and grow together.
                    </p>
                  </div>
                  
                  <div className="space-y-8 text-foreground">
                    <p className="text-lg">
                      At PortaPro, we're not just building software — we're building a movement. The PortaPro Community is here to bring together operators, field techs, dispatchers, and business owners who want to modernize operations, reduce chaos, and share real wins from the field.
                    </p>
                    
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">👥 Connect with Other Operators</h3>
                        <p className="mb-4">
                          Join our exclusive Facebook or Discord group to ask questions, swap dispatch tips, or just talk shop with others in the industry.
                        </p>
                        <Button className="bg-white text-primary hover:bg-white/90 font-semibold">
                          👉 Join the PortaPro Group
                        </Button>
                      </div>
                      
                      <div className="bg-muted/50 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4">🗺️ See Where PortaPro Is Used</h3>
                        <p>
                          From small towns to major metros, PortaPro is powering smarter operations across the country. Check out our growing footprint and hear real user stories.
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">🧠 Share Ideas & Shape the Product</h3>
                        <p className="mb-4">
                          We take your feedback seriously. Submit ideas, vote on features, and view our public roadmap.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button className="bg-white text-green-700 hover:bg-white/90 font-semibold">
                            👉 View the Roadmap
                          </Button>
                          <Button className="bg-white text-green-700 hover:bg-white/90 font-semibold">
                            👉 Submit a Feature Request
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">🔓 Become a Beta Tester</h3>
                        <p className="mb-4">
                          Be the first to try new features like QR scanning, lock tracking, and mobile updates. Help us test in real-world conditions before launch.
                        </p>
                        <Button className="bg-white text-orange-700 hover:bg-white/90 font-semibold">
                          👉 Sign Up for Early Access
                        </Button>
                      </div>
                      
                      <div className="bg-muted/50 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4">📚 The PortaPro Playbook</h3>
                        <p className="mb-4">
                          Explore a library of templates and how-to guides to improve your operation. Built by pros, for pros.
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            Pricing Calculator Templates
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            Inspection Checklists
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            Field Tech SOPs
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            Service Report Examples
                          </li>
                        </ul>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">🎉 Shoutouts & Wins from the Field</h3>
                        <p className="mb-4">
                          We highlight the real people making PortaPro great. Have a milestone or cool story? We might feature you next.
                        </p>
                        <Button className="bg-white text-purple-700 hover:bg-white/90 font-semibold">
                          👉 Submit Your Win
                        </Button>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">📩 Stay in the Loop</h3>
                        <p className="mb-4">
                          Get exclusive updates, product announcements, and community invites right in your inbox.
                        </p>
                        <Button className="bg-white text-blue-700 hover:bg-white/90 font-semibold">
                          👉 Subscribe to Updates
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-2 pt-8 border-t">
                      <p className="text-xl font-bold text-foreground">
                        PortaPro Community: Built for the Field — Together.
                      </p>
                      <p className="text-lg text-muted-foreground font-medium">
                        Your crew. Your customers. Your advantage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}

      <BlogSlider isOpen={blogSliderOpen} onClose={() => setBlogSliderOpen(false)} selectedPost={selectedBlogPost} onSelectPost={setSelectedBlogPost} />

      {/* Contact Form Popup */}
      {contactFormOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-foreground">Contact Support</h2>
              <button onClick={() => setContactFormOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Have a question or need help? Reach out to our support team.
                  </p>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <input type="text" required className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Your full name" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <input type="email" required className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="your@email.com" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company (Optional)
                    </label>
                    <input type="text" className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Your company name" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subject *
                    </label>
                    <select required className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="">Select a topic</option>
                      <option value="general">General Question</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing & Pricing</option>
                      <option value="demo">Request a Demo</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <textarea required rows={4} className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" placeholder="How can we help you?"></textarea>
                  </div>

                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3">
                    Send Message
                  </Button>
                </form>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Or contact us directly:
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      📧 support@portaprosoftware.com
                    </p>
                    <p className="text-sm font-medium">
                      📞 (216) 412-3239
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>}

      {/* Questions Form Popup */}
      {questionsFormOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Have Questions?</h2>
                <p className="text-muted-foreground">Tell us about your needs and we'll get in touch</p>
              </div>
              <button onClick={() => setQuestionsFormOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form className="space-y-4" onSubmit={e => {
            e.preventDefault();
            alert('Thank you for your interest! We\'ll be in touch within 24 hours.');
            setQuestionsFormOpen(false);
          }}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name *
                    </label>
                    <input type="text" required className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last Name *
                    </label>
                    <input type="text" required className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email *
                  </label>
                  <input type="email" required className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="john@company.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number (Optional)
                  </label>
                  <input type="tel" className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="(555) 123-4567" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Company Name *
                  </label>
                  <input type="text" required className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Your Company Name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    How many units are in your fleet?
                  </label>
                  <select className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option value="">Select fleet size</option>
                    <option value="1-25">1-25 units</option>
                    <option value="26-50">26-50 units</option>
                    <option value="51-100">51-100 units</option>
                    <option value="101-250">101-250 units</option>
                    <option value="251-500">251-500 units</option>
                    <option value="500+">500+ units</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    What's your biggest challenge right now?
                  </label>
                  <textarea rows={3} className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" placeholder="Tell us about your current pain points, scheduling issues, inventory tracking needs, etc."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred contact method
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input type="radio" name="contact" value="email" className="mr-2" defaultChecked />
                      Email
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="contact" value="phone" className="mr-2" />
                      Phone
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="contact" value="either" className="mr-2" />
                      Either
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🚀 What's next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We'll review your information and reach out within 24 hours</li>
                    <li>• Schedule a personalized demo based on your fleet size</li>
                    <li>• Discuss your specific challenges and how PortaPro can help</li>
                    <li>• Answer all your questions about features, pricing, and implementation</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setQuestionsFormOpen(false)} className="flex-1">
                    Maybe Later
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                    Send My Questions
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>}
    </div>;
};
export default Landing;