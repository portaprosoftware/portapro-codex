
import React, { useState } from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, Calendar, Truck, QrCode, CreditCard, FileText, MessageSquare, Users, Smartphone,
  ArrowRight, Play, Workflow, Database, BarChart3, ChevronRight, Zap, TrendingUp,
  Package, Globe, UserCheck, Timer, ChartLine, Gauge, Settings, Palette, Layers,
  Camera, Route, Wifi, Award, Star, Target, Phone, Mail, Building, Shield
} from "lucide-react";

// Enhanced feature anchors for the hero section
const featureAnchors = [
  {
    id: "job-wizard",
    title: "Job Wizard",
    icon: Workflow,
    description: "9-step enhanced job creation",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "inventory",
    title: "Multi-Site Inventory",
    icon: Database,
    description: "Real-time stock tracking",
    color: "from-green-500 to-green-600"
  },
  {
    id: "analytics",
    title: "Analytics Hub", 
    icon: BarChart3,
    description: "Live KPI dashboards",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "mobile",
    title: "Mobile App",
    icon: Smartphone,
    description: "Offline-capable driver app",
    color: "from-orange-500 to-orange-600"
  }
];

// Job Wizard features showcase
const jobWizardFeatures = [
  {
    step: "Customer & Location",
    description: "Smart customer selection with location autocomplete and service history",
    icon: Users
  },
  {
    step: "Multi-Date Scheduling",
    description: "Delivery, partial pickups, full returns with calendar integration",
    icon: Calendar
  },
  {
    step: "Inventory & Consumables",
    description: "Real-time availability checking and automated line-item pricing",
    icon: Package
  },
  {
    step: "Template Assignment",
    description: "Auto-assign service report templates based on job history",
    icon: FileText
  },
  {
    step: "Crew & Vehicle",
    description: "Drag-and-drop driver assignment with vehicle capacity planning",
    icon: Truck
  }
];

// Multi-site inventory features
const inventoryFeatures = [
  {
    title: "Bulk vs Individual Tracking",
    description: "Separate bulk stock from individual QR-coded units across multiple storage sites",
    icon: Layers
  },
  {
    title: "Real-Time Availability",
    description: "Date-range availability checking with interactive calendar views",
    icon: Calendar
  },
  {
    title: "Smart Alerts", 
    description: "Location-based low-stock alerts with automated reorder rules",
    icon: TrendingUp
  },
  {
    title: "QR Code Integration",
    description: "Smartphone scanning for instant unit identification and tracking",
    icon: QrCode
  }
];

// Quote-to-job conversion flow
const quoteFeatures = [
  {
    title: "Quote Creation Wizard",
    description: "Services, consumables, payment terms, and inventory reservations",
    icon: FileText
  },
  {
    title: "Customer Portal Integration", 
    description: "Customers can review, accept, and pay deposits directly online",
    icon: Globe
  },
  {
    title: "Stripe Payment Processing",
    description: "Secure deposit collection with automated invoice generation",
    icon: CreditCard
  },
  {
    title: "Auto Job Creation",
    description: "Accepted quotes instantly become live jobs with all details transferred",
    icon: Workflow
  }
];

// Team management features
const teamFeatures = [
  {
    title: "Unified User Profiles",
    description: "Role-based permissions for owners, dispatchers, and drivers",
    icon: UserCheck
  },
  {
    title: "Drag-and-Drop Scheduling",
    description: "Visual shift management with real-time calendar integration",
    icon: Calendar
  },
  {
    title: "Time-Off Management",
    description: "Mobile time-off requests with live schedule preview",
    icon: Timer
  },
  {
    title: "Performance Analytics",
    description: "Individual and team performance tracking with KPI monitoring",
    icon: ChartLine
  }
];

// Analytics hub features
const analyticsFeatures = [
  {
    title: "Real-Time KPI Dashboard",
    description: "Live metrics for job performance, fleet utilization, and revenue",
    icon: Gauge
  },
  {
    title: "Custom Chart Builder",
    description: "Drag-and-drop analytics with role-based filtering and exports",
    icon: BarChart3
  },
  {
    title: "Inventory Turnover",
    description: "Stock movement analysis with predictive reorder recommendations",
    icon: TrendingUp
  },
  {
    title: "Fuel & Maintenance Tracking",
    description: "Cost analysis with maintenance scheduling and parts inventory",
    icon: Settings
  }
];

// Report template designer features
const templateFeatures = [
  {
    title: "WYSIWYG Template Builder",
    description: "Drag-and-drop interface with live PDF preview",
    icon: Palette
  },
  {
    title: "Section Library",
    description: "Pre-built sections: Header, Client Info, Vehicle Details, Checklist, Photos, Signatures",
    icon: Layers
  },
  {
    title: "Template Versioning",
    description: "Version control with rollback capabilities and change tracking",
    icon: FileText
  },
  {
    title: "Smart Assignment",
    description: "Auto-assign templates based on job type and customer history",
    icon: Settings
  }
];

// Mobile app features
const mobileFeatures = [
  {
    title: "Offline Capability",
    description: "Full functionality without internet, syncs when connected",
    icon: Wifi
  },
  {
    title: "GPS Navigation",
    description: "Mapbox-powered routing with geofenced job completion",
    icon: Route
  },
  {
    title: "Photo & Signature Capture",
    description: "High-quality photos with geolocation and digital signatures",
    icon: Camera
  },
  {
    title: "Real-Time Updates",
    description: "Instant job updates with full audit trail logging",
    icon: ArrowRight
  }
];

// Customer testimonials
const testimonials = [
  {
    name: "Mike Johnson",
    company: "Premier Portable Services",
    quote: "PortaPro reduced our scheduling time by 80% and eliminated double-bookings completely.",
    rating: 5,
    metric: "80% time savings"
  },
  {
    name: "Sarah Chen", 
    company: "Coastal Sanitation",
    quote: "The mobile app keeps our drivers efficient even in areas with poor cell coverage.",
    rating: 5,
    metric: "99% uptime"
  },
  {
    name: "David Rodriguez",
    company: "Metro Waste Solutions", 
    quote: "Our customer satisfaction scores improved 40% since implementing the customer portal.",
    rating: 5,
    metric: "40% improvement"
  }
];

// Enterprise integrations
const integrations = [
  {
    name: "Stripe",
    description: "Payment processing & invoicing",
    logo: "💳"
  },
  {
    name: "Clerk",
    description: "Enterprise authentication",
    logo: "🔐"
  },
  {
    name: "Supabase",
    description: "Real-time database & backend",
    logo: "🗄️"
  },
  {
    name: "Mapbox",
    description: "GPS tracking & navigation",
    logo: "🗺️"
  },
  {
    name: "QuickBooks",
    description: "Accounting integration & financial reporting",
    logo: "📊"
  }
];

// Pricing tiers
const pricingTiers = [
  {
    name: "Starter",
    price: 99,
    description: "Perfect for small operations",
    features: [
      "Up to 5 vehicles",
      "Basic job scheduling", 
      "Mobile driver app",
      "Customer portal",
      "Email support"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Professional",
    price: 199,
    description: "Most popular for growing businesses",
    features: [
      "Unlimited vehicles",
      "Advanced analytics",
      "Multi-site inventory",
      "Quote-to-job conversion", 
      "Priority support",
      "API access"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: 399,
    description: "For large-scale operations",
    features: [
      "Everything in Professional",
      "Custom integrations",
      "Advanced reporting",
      "Dedicated support",
      "SLA guarantee",
      "Custom training"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export const Landing: React.FC = () => {
  const [isMonthly, setIsMonthly] = useState(true);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</a>
            <a href="#why-portapro" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Why PortaPro</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <SignInButton mode="modal" fallbackRedirectUrl="/app">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/app">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium">
                Get Started
              </Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full shadow-sm">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">#1 Platform for Portable Toilet Companies</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Enterprise-Grade
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Operations Platform
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                  From multi-step job wizards to real-time analytics, PortaPro delivers 
                  the sophisticated workflows enterprise operations demand.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <SignUpButton mode="modal" fallbackRedirectUrl="/app">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-4 h-auto">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </SignUpButton>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-2">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Free 30-day trial</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">No setup fees</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Save $28K+ annually</span>
                </div>
              </div>
            </div>
            
            <div className="relative animate-fade-in">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="/lovable-uploads/0a38a678-687b-4e6c-9715-d530993ed8a2.png" 
                  alt="PortaPro Enterprise Dashboard"
                  className="w-full h-auto rounded-xl"
                />
                
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full p-4 shadow-lg animate-pulse">
                  <Zap className="w-6 h-6" />
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full p-3 shadow-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Feature Anchor Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {featureAnchors.map((anchor, index) => (
              <Card 
                key={anchor.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-blue-200"
                onClick={() => scrollToSection(anchor.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${anchor.color} flex items-center justify-center shadow-lg`}>
                    <anchor.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{anchor.title}</h3>
                  <p className="text-sm text-muted-foreground">{anchor.description}</p>
                  <ChevronRight className="w-4 h-4 mx-auto mt-2 text-blue-600" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Job Wizard Demo Section */}
      <section id="job-wizard" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                  Multi-Step Job Creation
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                  Enterprise Job Wizard
                </h2>
                <p className="text-xl text-gray-600">
                  Our sophisticated 9-step wizard handles everything from delivery scheduling 
                  to crew assignment, consumables pricing, and template selection in one seamless flow.
                </p>
              </div>
              
              <div className="space-y-6">
                {jobWizardFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">{feature.step}</h4>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Play className="w-4 h-4 mr-2" />
                Watch Job Wizard Demo
              </Button>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Enhanced Job Creation</h3>
                    <Badge className="bg-green-100 text-green-700">Live Preview</Badge>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div key={step} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {step}
                        </div>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: step <= 3 ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Site Inventory Section */}
      <section id="inventory" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">1,247</div>
                    <div className="text-sm text-gray-600">Units Available</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Building className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">8</div>
                    <div className="text-sm text-gray-600">Storage Sites</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Main Yard - Standard Units</span>
                    <Badge className="bg-green-100 text-green-700">85 Available</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">North Site - Premium Units</span>
                    <Badge className="bg-yellow-100 text-yellow-700">12 Available</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">South Depot - Sinks</span>
                    <Badge className="bg-red-100 text-red-700">3 Available</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Real-Time Inventory Engine
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                  Multi-Site Inventory Management
                </h2>
                <p className="text-xl text-gray-600">
                  Split bulk stock across garages or yards, drill into individual unit availability 
                  by date, and trigger intelligent low-stock alerts.
                </p>
              </div>
              
              <div className="space-y-6">
                {inventoryFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote-to-Job Conversion Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 mb-4">
              Quote-to-Job Conversion
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Streamlined Quote-to-Job Flow
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bundle services and consumables, push quotes to customer portal, collect deposits via Stripe, 
              and auto-spin accepted quotes into live jobs and invoices.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {quoteFeatures.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-16 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">Quote Created</div>
                <p className="text-gray-600">Services & pricing defined</p>
              </div>
              <div className="text-center">
                <ArrowRight className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600 mb-2">Customer Accepts</div>
                <p className="text-gray-600">Portal payment & approval</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">Job & Invoice</div>
                <p className="text-gray-600">Automatically generated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Management & Analytics */}
      <section id="analytics" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-20">
            {/* Team Management */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                  Team Management
                </Badge>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Unified Team Operations
                </h3>
                <p className="text-lg text-gray-600">
                  Streamline user profiles, drag-and-drop driver scheduling, and time-off requests 
                  with live calendar previews and permission-based access.
                </p>
              </div>
              
              <div className="space-y-4">
                {teamFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics Hub */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                  Analytics Hub
                </Badge>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Real-Time Business Intelligence
                </h3>
                <p className="text-lg text-gray-600">
                  Live KPI dashboards with job performance, inventory turnover, fuel usage, 
                  and custom metrics—all filterable and exportable.
                </p>
              </div>
              
              <div className="space-y-4">
                {analyticsFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report Template Designer & Mobile App */}
      <section id="mobile" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-20">
            {/* Report Template Designer */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                  Template Designer
                </Badge>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  WYSIWYG Report Builder
                </h3>
                <p className="text-lg text-gray-600">
                  Two-pane drag-and-drop builder with live PDF preview, versioning, 
                  and smart template assignment based on job history.
                </p>
              </div>
              
              <div className="space-y-4">
                {templateFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Driver App */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Mobile Driver App
                </Badge>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900">
                  Offline-Capable Mobile Suite
                </h3>
                <p className="text-lg text-gray-600">
                  Auto-launching service templates, Mapbox navigation, geofenced routes, 
                  and full offline sync with audit trail logging.
                </p>
              </div>
              
              <div className="space-y-4">
                {mobileFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Success Stories */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600">
              See how PortaPro is transforming portable toilet operations nationwide
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:border-blue-200 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className="text-gray-700 mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="border-t pt-4">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.company}</div>
                    <Badge className="mt-2 bg-green-100 text-green-700">{testimonial.metric}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why PortaPro Section */}
      <section id="why-portapro" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Why Choose PortaPro?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for portable toilet companies by industry experts who understand your unique challenges
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Industry-Specific</h3>
              <p className="text-gray-600">Built exclusively for portable toilet rental companies with features you actually need</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Enterprise Security</h3>
              <p className="text-gray-600">Bank-level security with SOC 2 compliance and 99.9% uptime guarantee</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Expert Support</h3>
              <p className="text-gray-600">24/7 support from team members who understand your business inside and out</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Integrations */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 mb-4">
              Enterprise Integrations
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Deep Platform Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on enterprise-grade infrastructure with seamless integrations 
              for payments, authentication, mapping, and business systems.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {integrations.map((integration, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{integration.logo}</div>
                  <h4 className="font-semibold text-lg mb-2">{integration.name}</h4>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="text-gray-600 border-gray-300">SOC 2 Compliant</Badge>
            <Badge variant="outline" className="text-gray-600 border-gray-300">99.9% Uptime SLA</Badge>
            <Badge variant="outline" className="text-gray-600 border-gray-300">GDPR Ready</Badge>
            <Badge variant="outline" className="text-gray-600 border-gray-300">API-First Architecture</Badge>
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Transparent pricing that scales with your business. No hidden fees.
            </p>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`font-medium ${isMonthly ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
              <button
                onClick={() => setIsMonthly(!isMonthly)}
                className="relative w-14 h-8 bg-gray-200 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className={`absolute w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 top-1 ${isMonthly ? 'left-1' : 'left-7'}`} />
              </button>
              <span className={`font-medium ${!isMonthly ? 'text-gray-900' : 'text-gray-500'}`}>
                Annual 
                <Badge className="ml-2 bg-green-100 text-green-700">Save 20%</Badge>
              </span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`relative border-2 transition-all duration-300 hover:shadow-lg ${
                tier.popular ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 hover:border-blue-200'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      ${isMonthly ? tier.price : Math.round(tier.price * 0.8 * 12)}
                    </span>
                    <span className="text-gray-600">
                      /{isMonthly ? 'month' : 'year'}
                    </span>
                  </div>
                  <CardDescription className="text-lg mt-2">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <SignUpButton mode="modal" fallbackRedirectUrl="/app">
                    <Button 
                      className={`w-full ${
                        tier.popular 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </SignUpButton>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">All plans include a 30-day free trial. No credit card required.</p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <span>✓ 24/7 Support</span>
              <span>✓ 99.9% Uptime SLA</span>
              <span>✓ Data Export</span>
              <span>✓ Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join hundreds of portable toilet companies who have modernized their operations with PortaPro. 
            Start your free trial today and see the difference enterprise-grade software makes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <SignUpButton mode="modal" fallbackRedirectUrl="/app">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </SignUpButton>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-auto">
              <Phone className="w-5 h-5 mr-2" />
              Schedule Demo
            </Button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-100">Companies Trust PortaPro</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">$28K+</div>
              <div className="text-blue-100">Average Annual Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">Expert Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Integrations */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 mb-4">
              Enterprise Integrations
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Built on Enterprise Infrastructure
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Deep integrations with industry-leading platforms for payments, authentication, and business operations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {integrations.map((integration, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{integration.logo}</div>
                  <h4 className="font-semibold text-lg mb-2">{integration.name}</h4>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Enterprise Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Transparent pricing that scales with your business. No hidden fees.
            </p>
          </div>
          
          {pricingTiers.map((tier, index) => (
            <Card key={index} className="border-2 border-blue-500 shadow-lg">
              <CardHeader className="text-center pb-8">
                <Badge className="bg-blue-600 text-white px-4 py-1 mb-4">Most Popular</Badge>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${tier.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <CardDescription className="text-lg mt-2">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <SignUpButton mode="modal" fallbackRedirectUrl="/app">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {tier.cta}
                  </Button>
                </SignUpButton>
              </CardContent>
            </Card>
          ))}
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">All plans include a 30-day free trial. No credit card required.</p>
            <div className="flex justify-center gap-8 text-sm text-gray-500">
              <span>✓ 24/7 Support</span>
              <span>✓ 99.9% Uptime SLA</span>
              <span>✓ Data Export</span>
              <span>✓ Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join hundreds of portable toilet companies who have modernized their operations with PortaPro.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <SignUpButton mode="modal" fallbackRedirectUrl="/app">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </SignUpButton>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-auto">
              <Phone className="w-5 h-5 mr-2" />
              Schedule Demo
            </Button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-100">Companies Trust PortaPro</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">$28K+</div>
              <div className="text-blue-100">Average Annual Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-100">Expert Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="py-16 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Logo showText={false} />
                <span className="font-bold text-2xl">PortaPro</span>
              </div>
              <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                The enterprise-grade platform for portable toilet rental companies. 
                Streamline operations, increase efficiency, and grow your business with confidence.
              </p>
              <div className="flex gap-4 mb-6">
                <Badge variant="outline" className="text-gray-400 border-gray-600 hover:border-gray-500">
                  SOC 2 Compliant
                </Badge>
                <Badge variant="outline" className="text-gray-400 border-gray-600 hover:border-gray-500">
                  99.9% Uptime
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5" />
                  <span>support@portapro.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="w-5 h-5" />
                  <span>1-800-PORTAPRO</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-6">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-6">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              &copy; 2024 PortaPro. All rights reserved. Built with ❤️ for the portable toilet industry.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
