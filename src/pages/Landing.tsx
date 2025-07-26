
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
  }
];

// Pricing tiers
const pricingTiers = [
  {
    name: "Professional",
    price: 99,
    description: "Perfect for growing businesses",
    features: [
      "Unlimited vehicles & users",
      "Advanced job scheduling",
      "Multi-site inventory",
      "Mobile driver app",
      "Customer portal",
      "Analytics dashboard",
      "Priority support"
    ],
    cta: "Start Free Trial",
    popular: true
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
