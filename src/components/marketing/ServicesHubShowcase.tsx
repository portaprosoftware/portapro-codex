import React from "react";
import { ServiceHubDemo } from "./ServiceHubDemo";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import {
  CalendarClock,
  ClipboardList,
  ClipboardCheck,
  FileText,
  Camera,
  Signature,
  Smartphone,
  CloudOff,
  CheckCircle,
  Zap,
  Route,
  FileDown,
  Sparkles,
  User,
  Shield,
  Clock
} from "lucide-react";

export const ServicesHubShowcase: React.FC = () => {
  return (
    <section id="services-hub" className="py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Service & Reporting Hub</h2>
          <p className="text-muted-foreground">
            Schedule, document, and prove completion. Auto-assign service report templates when specific services are scheduled; drivers complete in the field—offline ready.
          </p>
        </header>

        <div className="space-y-8">
          {/* Interactive Demo */}
          <div className="space-y-4">
            <ServiceHubDemo />
            
            {/* Sample Service Report */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Sample Completed Service Report</h3>
              <div className="rounded-lg border border-border bg-card p-4">
                <img 
                  src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80" 
                  alt="Completed service report showing job details, photos, and customer signature" 
                  className="w-full h-auto rounded-md"
                />
              </div>
            </div>
          </div>

          {/* What Customers Love Card */}
          <div className="rounded-2xl border border-border p-6 bg-gradient-to-br from-green-50 to-blue-50">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              What Customers Love
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Proof of Service</h4>
                  <p className="text-sm text-muted-foreground">Photo documentation and digital signatures prove work completion</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Offline Ready</h4>
                  <p className="text-sm text-muted-foreground">Complete reports even without internet connection</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Auto-Assignment</h4>
                  <p className="text-sm text-muted-foreground">Templates automatically assigned based on service type</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Time Tracking</h4>
                  <p className="text-sm text-muted-foreground">Accurate service duration recording for billing</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FileDown className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">PDF Reports</h4>
                  <p className="text-sm text-muted-foreground">Professional reports generated automatically</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">Compliance Ready</h4>
                  <p className="text-sm text-muted-foreground">Meet regulatory requirements with documented services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesHubShowcase;