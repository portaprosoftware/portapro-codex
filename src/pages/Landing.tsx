import React from "react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Truck, Calendar, Users, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Job Scheduling",
    description: "Manage delivery and pickup schedules with real-time updates"
  },
  {
    icon: Truck,
    title: "Fleet Management",
    description: "Track your portable toilet inventory and vehicle fleet"
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Organize customer data and communication in one place"
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Get insights into your business performance"
  }
];

const benefits = [
  "Real-time job tracking and dispatch",
  "Automated scheduling and routing",
  "Customer portal for self-service",
  "Inventory management and alerts",
  "Mobile-friendly for drivers",
  "Comprehensive reporting"
];

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="btn-hero">Get Started</Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Portable Toilet Rental
            <span className="block text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your portable toilet rental business with our comprehensive 
            management platform. From scheduling to billing, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignUpButton mode="modal">
              <Button size="lg" className="btn-hero text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </SignUpButton>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Run Your Business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed specifically for portable toilet rental companies
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-elevated p-6 text-center hover:shadow-glow transition-all duration-300">
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Why Choose PortaPro?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Built by industry experts who understand the unique challenges 
              of portable toilet rental businesses.
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card-gradient rounded-2xl p-8 border border-border">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">30 Days</div>
              <div className="text-muted-foreground mb-6">Free Trial</div>
              <SignUpButton mode="modal">
                <Button className="btn-hero w-full mb-4">
                  Start Your Free Trial
                </Button>
              </SignUpButton>
              <p className="text-sm text-muted-foreground">
                No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <Logo />
          <div className="text-sm text-muted-foreground mt-4 md:mt-0">
            © 2025 PortaPro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};