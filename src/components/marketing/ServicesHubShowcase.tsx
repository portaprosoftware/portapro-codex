import React, { useState, useEffect } from "react";
import { ServiceReportingDemo } from "./ServiceReportingDemo";
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
  Sparkles
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
          <ServiceReportingDemo />
        </div>
      </div>
    </section>
  );
};

export default ServicesHubShowcase;