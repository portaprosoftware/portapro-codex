import React, { useState, useEffect, useRef } from 'react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';
import { ArrowRight, Play, CheckCircle, Truck, Users, BarChart3, ClipboardList, MapPin, Calendar, DollarSign, Zap, Building2, FileText, Smartphone, Heart, Phone, Mail, Menu, X, Camera, Eye, Compass, Database, Shield, Clock, BellRing, Wrench, CalendarClock, Gauge, HardHat, Route, CloudOff, QrCode, Laptop, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingLogo } from '@/components/ui/landing-logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BlogSlider } from '@/components/BlogSlider';
import { AutoCarousel } from '@/components/ui/AutoCarousel';
import { SchedulingGraphic } from '@/components/ui/SchedulingGraphic';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { StatCard } from '@/components/ui/StatCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedDrivers, useAllEnhancedUsers } from '@/hooks/useEnhancedDrivers';
import { useDriverShiftsForWeek } from '@/hooks/useScheduling';
import { TimeOffCalendarView } from '@/components/team/enhanced/TimeOffCalendarView';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { SmartWizardShowcase } from '@/components/marketing/SmartWizardShowcase';
import { AIPanelScanningShowcase } from '@/components/marketing/AIPanelScanningShowcase';
import { QuoteToJobShowcase } from '@/components/marketing/QuoteToJobShowcase';
import { DriverAppShowcase } from '@/components/marketing/DriverAppShowcase';
import { InventorySuppliesShowcase } from '@/components/marketing/InventorySuppliesShowcase';
import { InventoryManagementShowcase } from '@/components/marketing/InventoryManagementShowcase';
import { TrackingMethodsSlideshow } from '@/components/marketing/TrackingMethodsSlideshow';
import { QRGenerator } from '@/components/ui/qr-generator';
import { QRPanelRotator } from '@/components/ui/qr-panel-rotator';
import { ConsumablesShowcase } from '@/components/marketing/ConsumablesShowcase';
import { ServicesHubShowcase } from '@/components/marketing/ServicesHubShowcase';
import { MarketingShowcase } from '@/components/marketing/MarketingShowcase';
import { CustomerDashboardPortalShowcase } from '@/components/marketing/CustomerDashboardPortalShowcase';
import { FleetManagementShowcase } from '@/components/marketing/FleetManagementShowcase';
import { CompanyAnalyticsShowcase } from '@/components/marketing/CompanyAnalyticsShowcase';
import { AlertTriangle, Package, Droplets, ClipboardCheck, Megaphone } from 'lucide-react';
import { FeaturesMegaMenu } from '@/components/marketing/FeaturesMegaMenu';
import { FeaturesSheet } from '@/components/marketing/FeaturesSheet';
import { useIsMobile } from '@/hooks/use-mobile';

// Demo content arrays for carousels - empty to be populated
const aiScanningMedia: string[] = [];
const jobWizardMedia: string[] = [];
const quotesMedia: string[] = [];
const mobileAppMedia: string[] = [];
const fleetManagementMedia: string[] = [];
// Fleet detail placeholders
const fleetNotificationsMedia: string[] = [];
const fuelLogsMedia: string[] = [];
const driverAssignmentsMedia: string[] = [];
const teamManagementMedia: string[] = [];
const customerDashboardMedia: string[] = [];
const analyticsMedia: string[] = [];
const inventoryMedia: string[] = [];
const consumablesMedia: string[] = [];
const servicesHubMedia: string[] = [];
const marketingMedia: string[] = [];
const reportingMedia: string[] = [];
// Team detail placeholders
const teamSchedulingMedia: string[] = [];
const teamTimeOffMedia: string[] = [];
const teamTrainingMedia: string[] = [];
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
  title: "Accounts & Portals",
  description: "Accounts: Internal customer account management for your team. Portals: Self-service portals for your customers.",
  icon: Users,
  href: "#customer-portal"
}, {
  title: "Company Analytics",
  description: "Complete insights across your entire operation with 6 tabs, 24+ KPIs, and one-click reports.",
  icon: BarChart3,
  href: "#company-analytics"
}];

// Services & Operations - Section 3 (Blue background)
const servicesFeatures = [{
  title: "Inventory & Supplies",
  description: "Track units and consumables across multiple storage sites.",
  icon: Package,
  href: "#inventory"
}, {
  title: "Consumables",
  description: "Manage toilet paper, sanitizer, and cleaning supplies inventory.",
  icon: Droplets,
  href: "#consumables"
}, {
  title: "Services Hub",
  description: "Coordinate pumping, cleaning, and maintenance service operations.",
  icon: ClipboardCheck,
  href: "#services-hub"
}, {
  title: "Marketing Tools",
  description: "Customer communication, promotions, and lead generation features.",
  icon: Megaphone,
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
  const [featuresSheetOpen, setFeaturesSheetOpen] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<string | null>(null);
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const featuresMegaMenuRef = useRef<{
    triggerOpen: () => void;
  } | null>(null);
  const isMobile = useIsMobile();

  // Date string used across sections
  const todayStr = new Date().toISOString().split('T')[0];

  // Handle questions form
  const handleRequestInfo = () => {
    setQuestionsFormOpen(true);
  };

  // Handle Calendly popup
  const handleScheduleDemo = () => {
    setCalendlyOpen(true);
  };
  const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = 56;
        const additionalOffset = 120;
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const targetPosition = absoluteElementTop - headerHeight - additionalOffset;
        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // Team KPIs (live) for landing visualizations
  const {
    data: allUsers
  } = useAllEnhancedUsers();
  const totalMembers = allUsers?.length ?? 0;
  const {
    data: drivers
  } = useEnhancedDrivers();
  const activeDrivers = drivers?.length ?? 0;
  const {
    data: shiftsWeek
  } = useDriverShiftsForWeek(new Date());
  // using todayStr from Smart Job Wizard section above
  const shiftsToday = (shiftsWeek || []).filter(s => s.shift_date === todayStr).length;
  const {
    data: timeOffTodayCount = 0
  } = useQuery({
    queryKey: ['timeoff-today', todayStr],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('driver_time_off_requests').select('id').eq('status', 'approved').eq('request_date', todayStr);
      if (error) throw error;
      return (data || []).length;
    }
  });
  const {
    data: expiringCredsCount = 0
  } = useQuery({
    queryKey: ['expiring-creds', todayStr],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('driver_credentials').select('license_expiry_date, medical_card_expiry_date');
      if (error) throw error;
      const today = new Date(todayStr);
      const end = new Date(todayStr);
      end.setDate(end.getDate() + 30);
      const inWindow = (d: string | null) => {
        if (!d) return false;
        const dt = new Date(d);
        return dt >= today && dt <= end;
      };
      return (data || []).filter((row: any) => inWindow(row.license_expiry_date) || inWindow(row.medical_card_expiry_date)).length;
    }
  });
  return <div id="top" className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 h-14">
        <div className="container mx-auto px-12 h-full flex items-center justify-between max-w-full">
          <div className="flex items-center gap-6">
            <LandingLogo />
            <div className="hidden md:block">
              <FeaturesMegaMenu ref={featuresMegaMenuRef} />
            </div>
          </div>
          
          {/* Desktop Navigation & Auth Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Pricing</a>
              <button onClick={() => setQuestionsFormOpen(true)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Contact</button>
              <a href="#tour" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Watch</a>
            </nav>
            
            <div className="flex items-center gap-4">
              <a href="https://accounts.portaprosoftware.com/sign-in" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" className="text-sm font-medium shadow-none hover:shadow-none">Sign In</Button>
              </a>
              <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer">
                <Button className="bg-gradient-blue text-white text-sm font-medium">
                  Start Free Trial
                </Button>
              </a>
            </div>
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
                <button onClick={() => {
              setFeaturesSheetOpen(true);
              setMobileMenuOpen(false);
            }} className="block w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Features</button>
                <a href="#pricing" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Pricing</a>
                <button onClick={() => setQuestionsFormOpen(true)} className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Contact</button>
                <a href="#tour" className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform duration-200">Watch</a>
              </nav>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <a href="https://accounts.portaprosoftware.com/sign-in" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full font-medium bg-gradient-to-b from-muted via-muted to-muted/70 border-border text-foreground shadow-none hover:shadow-none">Sign In</Button>
                </a>
                <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full text-sm font-medium">Start Free Trial</Button>
                </a>
              </div>
            </div>
          </div>}
      </header>

      <FeaturesSheet open={featuresSheetOpen} onOpenChange={setFeaturesSheetOpen} />


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
                  Manage dispatch, inventory, daily service routes, quotes-to-invoices, vehicle upkeep, team coordination, certification tracking and customer communication — all from one simple, powerful platform.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button variant="outline" size="default" className="font-medium px-6 py-3 bg-gradient-to-b from-muted via-muted to-muted/70 border-border text-foreground hover:shadow-lg hover:-translate-y-1 transition-all duration-200 w-full flex items-center justify-center min-w-[160px]">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Start Free Trial
                  </Button>
                </a>
                <Button variant="outline" size="default" className="font-medium px-6 py-3 bg-gradient-to-b from-muted via-muted to-muted/70 border-border text-foreground hover:shadow-lg hover:-translate-y-1 transition-all duration-200 w-full sm:w-auto flex items-center justify-center min-w-[160px]" onClick={() => setQuestionsFormOpen(true)}>
                  <Phone className="w-4 h-4 mr-2" />
                  Request Information
                </Button>
              </div>
              
              <div className="space-y-6 mt-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-6 flex-wrap opacity-90">
                    <span className="text-white/80 text-sm">Trusted by operators across North America</span>
                    <button onClick={() => {
                    if (isMobile) {
                      setFeaturesSheetOpen(true);
                    } else {
                      featuresMegaMenuRef.current?.triggerOpen();
                    }
                  }} className="flex items-center gap-2 text-white/80 text-sm font-medium hover:text-white transition-all duration-200">
                      <Compass className="w-4 h-4 animate-[spin_3s_linear_infinite]" />
                      Explore All Features
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-white/90 text-sm font-semibold">4 User Roles Included:</h3>
                    <ul className="text-white/80 text-sm space-y-1">
                      <li>• Admin, Driver/Tech, Dispatcher & Customers (for unique customer portals)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <img src="/lovable-uploads/0b9e4b76-5c94-4466-b77f-93a65d668f43.png" alt="PortaPro Dashboard Preview" loading="lazy" decoding="async" className="w-full max-w-3xl mx-auto lg:max-w-none transform scale-[1.0125]" />
            </div>
          </div>
          
            {/* Feature badges - moved to blue background */}
            <div className="container mx-auto max-w-6xl px-6 mt-6">
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-gradient-blue text-white text-xs font-bold">
                  ✓ 14 Day Free Trial
                </span>
                <span className="px-3 py-1 rounded-full bg-gradient-blue text-white text-xs font-bold">
                  ✓ No setup fees
                </span>
                <span className="px-3 py-1 rounded-full bg-gradient-blue text-white text-xs font-bold">
                  ✓ Support included
                </span>
                <span className="px-3 py-1 rounded-full bg-gradient-blue text-white text-xs font-bold">
                  ✓ Unlimited users, trucks & units
                </span>
              </div>
            
            {/* Proof Bar - moved to blue background */}
            <div>
              <div className="sr-only">Proof Bar</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                <article className="rounded-2xl border bg-gradient-to-b from-muted via-muted to-muted/70 text-foreground p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-blue text-white flex items-center justify-center">
                      <ClipboardList className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-semibold">Industry-Focused</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Built specifically for portable toilet rentals.</p>
                </article>

                <article className="rounded-2xl border bg-gradient-to-b from-muted via-muted to-muted/70 text-foreground p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-green text-white flex items-center justify-center">
                      <DollarSign className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-semibold">Affordable Cost</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">One plan. Every feature. No hidden fees.</p>
                </article>

                <article className="rounded-2xl border bg-gradient-to-b from-muted via-muted to-muted/70 text-foreground p-6 shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-orange text-white flex items-center justify-center">
                      <Phone className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <h3 className="text-sm font-semibold">Friendly Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Complete assistance whenever you need it.</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - White */}
      <section id="about" className="py-6 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold">Ready to ditch the paperwork?</span> Start your free 14-day trial of PortaPro today.
            </p>
          </div>
        </div>
      </section>

      {/* Group 1: Operations Features - Blue */}
      <div id="operations-features" />
      <section id="features" className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Operations Features</h2>
            <p className="text-white/80 text-lg">Comprehensive tools for inventory, services, and customer engagement</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicesFeatures.map((feature, index) => <Card key={index} className="group rounded-2xl border border-border bg-gradient-to-b from-muted via-muted to-muted/70 text-foreground shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/30">
                <CardContent className="p-6 text-left">
                  <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                    <feature.icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-semibold text-lg mb-1 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                  <button onClick={() => scrollToSection(feature.href.substring(1))} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    Learn More <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Detailed Sections for Group 1: Operations Features */}

      {/* Inventory & Supplies — Unified, Accurate, Effortless - White */}
      <section id="inventory" className="bg-white py-0">
        <div className="container mx-auto max-w-6xl px-[24px]">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground py-[18px]">Inventory & Supplies — Unified, Accurate, Effortless</h2>
            <p className="text-lg text-muted-foreground">Track units and consumables across multiple storage sites with precision</p>
          </div>

          {/* Inventory KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            <StatCard title="Total Units" value="247" icon={Package} gradientFrom="#3B82F6" gradientTo="#1E40AF" iconBg="bg-blue-600" />
            <StatCard title="Available Today" value="89" icon={CheckCircle} gradientFrom="#10B981" gradientTo="#047857" iconBg="bg-emerald-600" />
            <StatCard title="Maintenance" value="3" icon={Wrench} gradientFrom="#F59E0B" gradientTo="#D97706" iconBg="bg-amber-600" />
          </div>

          {/* General Inventory Management */}
          <div className="mb-8">
            <div className="space-y-6 max-w-4xl mx-auto text-center">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">General Inventory Management</h3>
                <p className="text-lg text-muted-foreground mb-6">Every unit has a dedicated tracking system for comprehensive inventory control and management.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Unified tracking system for all inventory types</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Multi-location stock allocation and transfers</span>
                  </div>
                </div>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Date-range availability checking and reservations</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Automatic low-stock alerts and reorder points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Inventory Demo */}
          <div className="mb-12">
            <InventoryManagementShowcase />
          </div>
          {/* Inventory & Location Management - Combined Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground">Inventory & Location Management</h3>
              <p className="text-lg text-muted-foreground">Stay on top of every unit with real-time tracking and multi-location control.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center">
                  <BellRing className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-foreground">Real-time tracking with automated alerts</h4>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center">
                  <Route className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-foreground">Manage stock across multiple sites with transfer tracking</h4>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-foreground">Bulk (auto-assign) or individual unit tracking simultaneously</h4>
              </div>
            </div>
          </div>

          {/* QR & Photo Scanning - Full Width Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground">QR & Photo Scanning</h3>
              <p className="text-lg text-muted-foreground mt-2">Instant unit identification and documentation with mobile scanning capabilities.</p>
              
              {/* Feature List - Moved above cards */}
              <div className="mt-6 flex justify-center">
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                  <li className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Mobile QR code scanning for units</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Photo documentation for condition tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CloudOff className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Offline scanning with auto-sync capabilities</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Snap & Track Units Card */}
              <div className="border rounded-lg p-6 bg-card">
                <div className="mb-4">
                  <h4 className="text-base font-normal text-center">Snap & Track Units from Embedded Plastic Text Numbers</h4>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-lg overflow-hidden">
                      <img src="/lovable-uploads/4ba172a8-8093-4d4e-9143-53090809b31e.png" alt="Phone scanning embossed plastic text on portable toilet unit" className="w-full max-w-sm h-auto" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="bg-gradient-green text-white px-3 py-1 rounded-full text-sm font-bold inline-block">
                        ✓ Successfully tracked
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Vendor:</span> ABC Manufacturing</div>
                        <div><span className="font-medium">Tool No:</span> T-207788-1A</div>
                        <div><span className="font-medium">Vendor ID:</span> 32123</div>
                        <div><span className="font-medium">Mfg Date:</span> January 13, 2016</div>
                        <div><span className="font-medium">Plastic:</span> HDPE</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Works offline — syncs later. Instant attach to units & jobs.
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Generator Section */}
              <QRGenerator />
            </div>
          </div>


          {/* Unit Maintenance & History - Full Width Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground">Unit Maintenance & History</h3>
              <p className="text-lg text-muted-foreground mt-2">Comprehensive maintenance tracking with automated work order management.</p>
              
              {/* Feature List */}
              <div className="mt-6 flex justify-center">
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                  <li className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Mobile maintenance work order management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Complete service history and cost tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CalendarClock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Photo storage and task updates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Why Teams Love PortaPro Section - Condensed */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="text-lg font-bold text-foreground mb-4">🚀 Why Teams Love PortaPro Product Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column - First 4 items */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Bulk, individual, and hybrid tracking in one system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Date-range availability by location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">QR codes & embossed-plastic AI reading</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Maintenance work orders with technician & cost tracking</span>
                  </li>
                </ul>
                
                {/* Right Column - Last 4 items */}
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Service history & automated scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Padlock & zip-tie drop-off notations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Clear status at a glance — available, assigned, service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Works offline: scan QR codes or unit serials, everything saves and syncs automatically once reconnected</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* Section Divider */}
      <div className="bg-white py-[10px]">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

      {/* Consumables - White */}
      <ConsumablesShowcase />

      {/* Section Divider */}
      <div className="py-3 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

      {/* Services Hub - White */}
      <ServicesHubShowcase />

      {/* Section Divider */}
      <div className="py-3 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

      {/* Marketing Tools - White */}
      <MarketingShowcase />

      {/* Group 2: Core Features - Blue */}
      <div id="core-workflow-features" />
      <section className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Core Workflow Features</h2>
            <p className="text-white/80 text-lg">Essential tools to get your business running efficiently</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreFeatures.map((feature, index) => <Card key={index} className="group rounded-2xl border border-border bg-gradient-to-b from-muted via-muted to-muted/70 text-foreground shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/30">
                  <CardContent className="p-6 text-left">
                    <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <feature.icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-semibold text-lg mb-1 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                    <button onClick={() => scrollToSection(feature.href.substring(1))} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Learn More <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </CardContent>
                </Card>)}
          </div>
        </div>
      </section>

      {/* Detailed Sections for Group 2: Core Features */}

      {/* Smart AI Panel Scanning Section - White */}
      <section id="ai-scanning" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <AIPanelScanningShowcase />
        </div>
      </section>

      {/* Section Divider */}
      <div className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

      {/* Job Wizard Showcase - White */}
      <section id="job-wizard" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <SmartWizardShowcase />
          
          {/* Jobs: Calendar, Dispatch, Drag-Drop & Map Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8">Jobs: Calendar, Dispatch, Drag-Drop & Map</h2>
            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <script src="https://fast.wistia.com/player.js" async></script>
                <script src="https://fast.wistia.com/embed/7fdf1aomkc.js" async type="module"></script>
                <style dangerouslySetInnerHTML={{
                __html: `
                    wistia-player[media-id='7fdf1aomkc']:not(:defined) { 
                      background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/7fdf1aomkc/swatch'); 
                      display: block; 
                      filter: blur(5px); 
                      padding-top:50.42%; 
                    }
                  `
              }} />
                <wistia-player media-id="7fdf1aomkc" aspect="1.9834710743801653"></wistia-player>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

      {/* Quote-to-Job Flow - White */}
      <section id="quotes" className="min-h-screen py-8 bg-white md:min-h-0">
        <div className="container mx-auto max-w-6xl px-6">
          <QuoteToJobShowcase />
        </div>
      </section>

      {/* Section Divider */}
      <div className="py-4 bg-white hidden md:block">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

      {/* Driver Mobile App - White */}
      <section id="mobile-app" className="min-h-screen py-12 bg-white md:min-h-0 md:py-8 clear-both">
        <div className="container mx-auto max-w-6xl px-6">
          <DriverAppShowcase />
        </div>
      </section>

      {/* Group 3: Management Features - Blue */}
      <div id="management-features" />
      <section className="py-8 bg-gradient-blue">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Management Features</h2>
            <p className="text-white/80 text-lg">Advanced tools for fleet, team, and business management</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {managementFeatures.map((feature, index) => <Card key={index} className="group rounded-2xl border border-border bg-gradient-to-b from-muted via-muted to-muted/70 text-foreground shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/30">
                  <CardContent className="p-6 text-left">
                    <div className="w-10 h-10 mx-auto mb-4 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <feature.icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-semibold text-lg mb-1 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                    <button onClick={() => scrollToSection(feature.href.substring(1))} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Learn More <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </CardContent>
                </Card>)}
          </div>
        </div>
      </section>

      {/* Detailed Sections for Group 3: Management Features */}

      {/* Fleet Management (includes Transport & Spill Compliance + DVIRs) - White */}
      <section id="fleet-management" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Fleet Management & Compliance</h2>
            <p className="text-lg text-muted-foreground">Complete vehicle tracking, maintenance, and compliance management</p>
          </div>


          {/* Fleet KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            <StatCard title="Active Drivers" value={8} icon={Users} gradientFrom="hsl(217, 91%, 60%)" gradientTo="hsl(217, 91%, 50%)" iconBg="hsl(217, 91%, 60%)" subtitle={<span className="text-muted-foreground">On schedule today</span>} />
            <StatCard title="Monthly Fuel Spend" value={"$10,932"} icon={DollarSign} gradientFrom="hsl(38, 90%, 50%)" gradientTo="hsl(38, 90%, 40%)" iconBg="hsl(38, 90%, 50%)" subtitle={<span className="text-muted-foreground">Down 6% vs last month</span>} />
            <StatCard title="Upcoming Services" value={9} icon={Wrench} gradientFrom="hsl(25, 95%, 53%)" gradientTo="hsl(25, 95%, 43%)" iconBg="hsl(25, 95%, 53%)" subtitle={<span className="text-muted-foreground">Due in next 7 days</span>} />
          </div>

          {/* General Fleet Tracking */}
          {/* General Fleet Tracking - Left Aligned Header */}
          <div className="flex flex-col mb-8">
            <div className="max-w-4xl space-y-6">
              <h3 className="text-2xl font-bold text-foreground text-left">General Fleet Tracking</h3>
              <p className="text-lg text-muted-foreground text-left">Every vehicle has a dedicated "home base" for comprehensive management and tracking.</p>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex items-start gap-3 text-left">
                  <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Vehicle profiles with status, location, and availability</span>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <Gauge className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Automatic and manual mileage tracking with history</span>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Photo documentation for condition and damage tracking</span>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Document management with expiry alerts and compliance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignments and Compliance Locker Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Assignments</h3>
                    <p className="text-sm text-gray-600">Daily driver shifts with vehicle handoffs and checklists.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Compliance Locker</h3>
                    <p className="text-sm text-gray-600">DOCs, registrations, insurance—alerts before anything expires.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scheduled PMs and Parts & Costs Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Scheduled PMs</h3>
                    <p className="text-sm text-gray-600">Set mileage or time-based intervals. Auto-create work orders when due.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">Parts & Costs</h3>
                    <p className="text-sm text-gray-600">Track parts, labor, and vendor invoices. Roll-up cost per vehicle.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fleet Management Showcase - Full Width */}
          <div className="col-span-full mt-8">
            {/* Interactive Demo Info */}
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                Interactive Demo: Click the tabs below to explore different vehicle management features
              </p>
            </div>
            <FleetManagementShowcase />
          </div>


          {/* Maintenance Notifications & Scheduling */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6 order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-foreground">Maintenance Notifications & Scheduling</h3>
              <p className="text-lg text-muted-foreground">Never miss a service with automated alerts and a clean calendar view.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <BellRing className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Threshold-based alerts: mileage, engine hours, dates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Drag-and-drop scheduling with conflict warnings</span>
                </li>
                <li className="flex items-start gap-3">
                  <Wrench className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Auto-generate work orders with parts and labor</span>
                </li>
              </ul>
            </div>
            <img src="/lovable-uploads/9d80fc9b-a26b-4daa-92af-1c965d64ff86.png" alt="Maintenance notifications showing past due and due this week tasks" className="w-full h-auto rounded-lg" />
          </div>

          {/* Fuel Logs & Cost Tracking */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6 order-2 lg:order-1">
              <h3 className="text-2xl font-bold text-foreground">Fuel Logs & Cost Tracking</h3>
              <p className="text-lg text-muted-foreground">Understand spend, MPG, and trends across the fleet.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Receipt photos with automatic data capture</span>
                </li>
                <li className="flex items-start gap-3">
                  <Gauge className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">MPG by vehicle and route—spot outliers fast</span>
                </li>
                <li className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Monthly budget vs actual with trendlines</span>
                </li>
              </ul>
            </div>
            <img src="/lovable-uploads/a133d807-54c7-49e6-a9b3-a5fd12dbda2c.png" alt="Fuel management dashboard showing total gallons, costs, and fleet MPG metrics" className="w-full h-auto rounded-lg" />
          </div>

          {/* Driver Assignments */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6 order-2 lg:order-1">
              <h3 className="text-2xl font-bold text-foreground">Driver Assignments</h3>
              <p className="text-lg text-muted-foreground">Simple, clear dispatch—drivers know exactly where to go.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Drag-and-drop shift board with availability</span>
                </li>
                <li className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Pre-trip checklists and handoff notes</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Routes and stops synced to the mobile app</span>
                </li>
              </ul>
            </div>
            <img src="/lovable-uploads/0b7accb8-59a2-4da2-9dc3-788ae3549efe.png" alt="Vehicle selection interface showing fleet vehicles with license plates, makes, models, and availability status" className="w-full h-auto rounded-lg" />
          </div>

          {/* Truck Stock Management */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-foreground">Truck Stock Management</h3>
              <p className="text-lg text-muted-foreground">Optimize vehicle loading and track real-time inventory across your fleet.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Vehicle selection and inventory tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Route vs truck stock comparison</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Stock readiness validation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Service date planning</span>
                </li>
                <li className="flex items-start gap-3">
                  <Gauge className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Real-time inventory status</span>
                </li>
              </ul>
            </div>
            <img src="/lovable-uploads/b7bba73c-5402-4e55-8417-455d18cb3338.png" alt="Truck Stock Management interface showing vehicle selection dropdown and Route vs Truck Stock comparison with service date picker" className="w-full h-auto rounded-lg" />
          </div>

          {/* Transport & Spill Compliance */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6 order-1 lg:order-2">
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
            <img src="/lovable-uploads/765a797c-a357-42cd-922e-92fb794966bd.png" alt="Transport & Spill Compliance dashboard showing document status alerts for overdue, critical, and warning items" className="w-full h-auto rounded-lg" />
          </div>

          {/* DVIRs & Maintenance */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-1 lg:order-2">
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
            <img src="/lovable-uploads/c021b264-552c-4a3e-b4c3-fcc1d6163147.png" alt="New DVIR form interface showing asset type selection, vehicle details, and defect reporting for fleet maintenance" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

    {/* Team Management - White */}
      <section id="team-management" className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Team Management & Scheduling</h2>
            <p className="text-lg text-muted-foreground">Everything you need to manage people, time, and compliance</p>
          </div>

          {/* Team KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            <StatCard title="Shifts Today" value={8} icon={CalendarClock} gradientFrom="hsl(142, 76%, 36%)" gradientTo="hsl(142, 76%, 25%)" iconBg="hsl(142, 76%, 36%)" subtitle={<span className="text-muted-foreground">Scheduled shifts</span>} />
            <StatCard title="Approved Time Off" value={1} icon={Calendar} gradientFrom="hsl(var(--destructive))" gradientTo="hsl(var(--destructive) / 0.7)" iconBg="hsl(var(--destructive))" subtitle={<span className="text-muted-foreground">Today</span>} />
            <StatCard title="Expiring Credentials" value={3} icon={Shield} gradientFrom="hsl(45, 93%, 55%)" gradientTo="hsl(45, 93%, 45%)" iconBg="hsl(45, 93%, 55%)" subtitle={<span className="text-muted-foreground">Next 30 days</span>} />
          </div>

          {/* Team Ops Toolkit */}
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <div className="p-5 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Shift Templates</h4>
              </div>
              <p className="text-sm text-muted-foreground">Reusable day parts and roles to schedule faster with consistency.</p>
            </div>
            <div className="p-5 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Availability</h4>
              </div>
              <p className="text-sm text-muted-foreground">See who’s available at a glance with conflict detection.</p>
            </div>
            <div className="p-5 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Time Off Approvals</h4>
              </div>
              <p className="text-sm text-muted-foreground">Structured requests with status, notes, and attachments.</p>
            </div>
            <div className="p-5 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Roles & Permissions</h4>
              </div>
              <p className="text-sm text-muted-foreground">Owner/Admin controlled approvals</p>
            </div>
          </div>

          {/* Scheduling & Availability */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
            <div className="space-y-6 order-2 lg:order-1">
              <h3 className="text-2xl font-bold text-foreground">Scheduling & Availability</h3>
              <p className="text-lg text-muted-foreground">Plan faster with draggable shifts and clear daily rollups.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Weekly board with driver assignment and handoffs</span>
                </li>
                <li className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Templates for morning/afternoon/evening shifts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Conflict checks and warnings before double-booking</span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <SchedulingGraphic />
            </div>
          </div>

          {/* Time Off & Leave Management */}
          <div className="grid lg:grid-cols-2 gap-8 items-start mb-12">
            <div className="space-y-6 order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-foreground">Time Off & Leave Management</h3>
              <p className="text-lg text-muted-foreground">Approve requests quickly with a clean, visual calendar.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Full-day, AM/PM, or custom times with reasons</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Statuses: pending, approved, denied</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Instant visibility into impact to shifts</span>
                </li>
              </ul>
            </div>
            
            <div className="flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-xs">
                <AspectRatio ratio={1}>
                  <div className="h-full">
                    <TimeOffCalendarView compact />
                  </div>
                </AspectRatio>
              </div>
            </div>
          </div>

          {/* Training & Compliance */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-foreground">Training & Compliance</h3>
              <p className="text-lg text-muted-foreground">Keep licenses, medical cards, and trainings up to date.</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Auto-reminders for upcoming expirations</span>
                </li>
                <li className="flex items-start gap-3">
                  <ClipboardList className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Track certifications and attach proof</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">Company-specific requirements per role</span>
                </li>
              </ul>
            </div>
            <img src="/lovable-uploads/0311afae-06cb-4157-9104-e58e14de00b0.png" alt="Training Requirements management interface" className="order-2 lg:order-1 w-[85%] h-auto" />
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

      {/* Customer Accounts & Portals - White */}
      <CustomerDashboardPortalShowcase />

      {/* Section Divider */}
      <div className="py-8 bg-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="border-t-2 border-border"></div>
        </div>
      </div>

      {/* Company Analytics - White */}
      <CompanyAnalyticsShowcase />





      {/* Pricing - Blue */}
      <section id="pricing" className="py-4 bg-gradient-blue text-white">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-white/90">
                One complete package with everything included
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className={`font-medium ${!isAnnual ? 'text-white' : 'text-white/70'}`}>Monthly</span>
              <button onClick={() => setIsAnnual(!isAnnual)} className={`relative w-12 h-6 rounded-full transition-colors ${isAnnual ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-white/30'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${isAnnual ? 'bg-white translate-x-7' : 'bg-white translate-x-1'}`} />
              </button>
              <span className={`font-medium ${isAnnual ? 'text-white' : 'text-white/70'}`}>
                Annual <Badge variant="secondary" className={`ml-1 ${isAnnual ? 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold' : 'bg-white/20 text-white'}`}>Save $50/month</Badge>
              </span>
            </div>
            
            <div className="flex justify-center mt-6">
              <Card className="relative border-gray-300/50 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 shadow-2xl shadow-gray-900/10 max-w-2xl w-full backdrop-blur-sm ring-1 ring-gray-300/50 sm:scale-115">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-gray-500/20 rounded-lg"></div>
                <CardHeader className="text-center relative z-10 px-4 sm:px-6">
                  <CardTitle className="text-xl sm:text-2xl text-gray-900 font-bold">{completePackage.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ${isAnnual ? completePackage.price.annual : completePackage.price.monthly}
                      <span className="text-base sm:text-lg font-normal text-gray-600">
                        /month
                      </span>
                    </div>
                     {isAnnual && <div className="text-xs sm:text-sm text-gray-700 font-bold">
                        Billed annually (${(completePackage.price.annual * 12).toLocaleString()}/year) - Save $600/year
                      </div>}
                  </div>
                  <CardDescription className="text-sm sm:text-base text-gray-700 font-bold">{completePackage.description}</CardDescription>
                </CardHeader>
                <div className="mt-0 mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 relative z-10 px-4">
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md text-xs sm:text-sm">14-day trial</Badge>
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md text-xs sm:text-sm">Full support included</Badge>
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md text-xs sm:text-sm">No contracts required</Badge>
                </div>
                <CardContent className="space-y-4 relative z-10 px-4 sm:px-6">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {completePackage.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-gray-800 font-medium leading-tight">{feature}</span>
                      </li>)}
                  </ul>
                  <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-gradient-blue text-white hover:bg-blue-700 text-lg py-6 mt-6 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
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
            <div className="rounded-2xl p-12 shadow-md border bg-card flex items-center justify-center min-h-[300px]">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-foreground">Updated PortaPro Preview coming soon!</h3>
                <p className="text-lg text-muted-foreground">New Features</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer id="resources" className="py-8 sm:py-16 px-4 sm:px-6 bg-gradient-blue text-white border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-white text-sm sm:text-base">Product</h4>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-white/80">
                <button onClick={() => {
                if (isMobile) {
                  setFeaturesSheetOpen(true);
                } else {
                  featuresMegaMenuRef.current?.triggerOpen();
                }
              }} className="block hover:text-white text-left">Features</button>
                <a href="#mobile-app" className="block hover:text-white">Mobile App</a>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-white text-sm sm:text-base">Company</h4>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-white/80">
                <button onClick={() => setAboutSliderOpen(true)} className="block hover:text-white text-left">About</button>
                <a href="#" className="block hover:text-white">Careers</a>
                <button onClick={() => setBlogSliderOpen(true)} className="block hover:text-white text-left">Blog</button>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-white text-sm sm:text-base">Resources</h4>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-white/80">
                <a href="/help" className="block hover:text-white">Help Center</a>
                <button onClick={() => setCommunitySliderOpen(true)} className="block hover:text-white text-left">Community</button>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-white text-sm sm:text-base">Legal</h4>
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-white/80">
                <button onClick={() => setTermsSliderOpen(true)} className="block hover:text-white text-left">Terms</button>
                <button onClick={() => setPrivacySliderOpen(true)} className="block hover:text-white text-left">Privacy</button>
                <button onClick={() => setSecuritySliderOpen(true)} className="block hover:text-white text-left">Security</button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-white/20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <LandingLogo variant="footer" />
                <span className="text-xs sm:text-sm text-white/80">© 2025 PortaPro. All rights reserved.</span>
              </div>
              
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center gap-2 text-white/80">
                  <Phone className="w-4 h-4" />
                  <a href="tel:+12164123239" className="hover:text-white transition-colors text-sm">
                    (216) 412-3239
                  </a>
                </div>
                <button onClick={() => setContactFormOpen(true)} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors justify-start sm:justify-center">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Contact Us</span>
                </button>
                <button onClick={() => scrollToSection('top')} className="text-white/80 hover:text-white transition-colors text-sm text-left sm:text-center">
                  ↑ Back to top
                </button>
              </div>
            </div>
            
            {/* Mobile CTA */}
            <div className="block sm:hidden">
              <a href="https://accounts.portaprosoftware.com/sign-up" target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-medium py-3 rounded-lg shadow-lg">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
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
                  <select className="w-full px-3 py-2 border border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option value="">Select your main challenge</option>
                    <option value="scheduling">Scheduling and dispatching</option>
                    <option value="inventory">Inventory tracking</option>
                    <option value="customer-management">Customer management</option>
                    <option value="billing-invoicing">Billing and invoicing</option>
                    <option value="driver-coordination">Driver coordination</option>
                    <option value="fleet-maintenance">Fleet maintenance</option>
                    <option value="reporting">Reporting and analytics</option>
                    <option value="other">Other</option>
                  </select>
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

                <div className="bg-muted/30 border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">What's next? 🚀</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
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


      {/* Calendly Popup Widget */}
      {calendlyOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] mx-4">
            <button onClick={() => setCalendlyOpen(false)} className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <iframe src="https://calendly.com/portapro/portapro-software-demo?embed_type=Inline&embed_domain=1&hide_gdpr_banner=1" width="100%" height="100%" className="rounded-lg" frameBorder="0" title="Schedule Demo" />
          </div>
        </div>}

      {/* Schedule Demo Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={handleScheduleDemo} className="bg-gradient-blue text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <Laptop className="w-4 h-4 mr-2" />
          Schedule Demo
        </Button>
      </div>
    </div>;
};
export default Landing;