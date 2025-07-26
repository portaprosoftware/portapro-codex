
import React from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Calendar, Truck, QrCode, CreditCard, FileText, MessageSquare, Users, Smartphone } from "lucide-react";

const mainFeatures = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Intelligent scheduling with route optimization and automated driver assignments."
  },
  {
    icon: Truck,
    title: "Fleet Management", 
    description: "Complete fleet oversight with tracking, maintenance scheduling, and compliance management."
  },
  {
    icon: QrCode,
    title: "QR Code Inventory",
    description: "Track units and service history with mobile QR code scanning on any smartphone."
  },
  {
    icon: CreditCard,
    title: "Integrated Payments",
    description: "Accept payments online and in-person with no additional hardware required."
  },
  {
    icon: FileText,
    title: "QuickBooks Integration",
    description: "One-click export of invoices and quotes to QuickBooks Online and Desktop."
  },
  {
    icon: MessageSquare,
    title: "Customer Communication",
    description: "Automated SMS and email updates with AI-powered marketing content generation."
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Centralized customer data with multiple service locations and billing preferences."
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    description: "Driver app with offline capability, photo capture, and real-time job updates."
  }
];

const driverFeatures = [
  { title: "Offline Capable", description: "Works without internet" },
  { title: "Photo Documentation", description: "Capture with GPS tagging" },
  { title: "QR Scanning", description: "Instant identification" },
  { title: "GPS Tracking", description: "Real-time location" }
];

const customerFeatures = [
  { title: "Account Dashboard", description: "View history & appointments" },
  { title: "Online Payments", description: "Secure payment processing" },
  { title: "Service Scheduling", description: "Request & track services" },
  { title: "Real-time Updates", description: "SMS & email notifications" }
];

const pricingFeatures = [
  "Unlimited users and drivers",
  "Fleet management tools", 
  "Mobile driver app",
  "Automated invoicing",
  "QuickBooks integration",
  "24/7 phone support",
  "No setup fees",
  "Complete scheduling system",
  "QR code inventory tracking",
  "Customer portal",
  "Payment processing",
  "SMS and email automation",
  "Free data migration",
  "Cancel anytime"
];

const benefits = [
  "Save $28K+ annually vs enterprise platforms",
  "Setup in 1 hour with free data migration", 
  "Cancel anytime with no long-term contracts"
];

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <SignInButton mode="modal" fallbackRedirectUrl="/app">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/app">
              <Button>Start Free Trial</Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                All-in-one platform for portable toilet rental companies
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Streamline scheduling, fleet management, dispatch, invoicing, 
                and customer communication. Everything you need to run your 
                business efficiently in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <SignUpButton mode="modal" fallbackRedirectUrl="/app">
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                    Start Free Trial
                  </Button>
                </SignUpButton>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Schedule Demo
                </Button>
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                  ▶ Watch Preview
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-300" />
                  <span>21-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-300" />
                  <span>Full support included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-300" />
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/lovable-uploads/0a38a678-687b-4e6c-9715-d530993ed8a2.png" 
                alt="PortaPro Platform Preview"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section id="features" className="section-padding bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything you need in one platform
            </h2>
            <p className="text-xl text-muted-foreground">
              Built specifically for portable toilet rental companies
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mainFeatures.map((feature, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-lg transition-all duration-300 border border-border/50">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App & Customer Portal Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white section-padding">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">
              Powerful Mobile App & Customer Portal
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Your drivers stay connected with offline-capable mobile apps, while 
              customers enjoy a seamless portal experience for tracking, payments, and 
              communication.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 mb-16">
            <div>
              <h3 className="text-2xl font-bold mb-4">Driver Mobile App</h3>
              <p className="text-blue-100 mb-8">
                Optimized route planning, real-time job updates, and seamless communication.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {driverFeatures.map((feature, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-blue-100">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-4">Customer Portal</h3>
              <p className="text-blue-100 mb-8">
                Real-time tracking, service history, and easy payment management.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {customerFeatures.map((feature, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-blue-100">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white section-padding">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-xl text-blue-100 mb-12">
            One plan with everything included. No hidden fees.
          </p>

          <div className="flex justify-center mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30">
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 text-sm">Monthly</span>
                <div className="w-12 h-6 bg-white rounded-full relative">
                  <div className="w-5 h-5 bg-blue-600 rounded-full absolute right-0.5 top-0.5"></div>
                </div>
                <span className="px-4 py-2 text-sm">Annual</span>
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Save $600
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="p-8 bg-white text-gray-900">
              <h3 className="text-2xl font-bold mb-2">PortaPro Complete</h3>
              <div className="text-4xl font-bold text-green-600 mb-2">
                $125<span className="text-lg text-gray-600">/month</span>
              </div>
              <p className="text-gray-600 mb-8">
                Billed annually • Everything you need to run your business
              </p>
              
              <div className="grid grid-cols-2 gap-y-4 text-left text-sm mb-8">
                {pricingFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <SignUpButton mode="modal" fallbackRedirectUrl="/app">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4">
                  Start Free Trial
                </Button>
              </SignUpButton>
              <p className="text-sm text-gray-500">
                21-day free trial • Full Support Included • Cancel Anytime
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white section-padding">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Join portable toilet companies nationwide saving time, money, and growing 
            faster with PortaPro Software.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-semibold">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 mb-6">
              Schedule Demo Today
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex">
              {[1,2,3,4,5].map((star) => (
                <span key={star} className="text-yellow-400 text-2xl">★</span>
              ))}
            </div>
            <span className="text-lg font-semibold ml-2">5.0/5.0 customer satisfaction</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-300" />
              <span>No pressure sales call</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-300" />
              <span>Custom demo</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-300" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border section-padding">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <Logo />
            <p className="text-muted-foreground mt-4 max-w-md mx-auto">
              The complete business management platform for portable toilet rental companies.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
            <div className="flex gap-6 text-sm text-muted-foreground mb-4 md:mb-0">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Security</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 PortaPro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
