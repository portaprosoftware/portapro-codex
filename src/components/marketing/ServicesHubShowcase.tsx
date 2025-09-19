import React, { useState, useEffect } from "react";
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
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Service and Reporting Hub</h2>
          <p className="text-muted-foreground">
            Schedule, document, and prove completion. Auto-assign service report templates when specific services are scheduled; drivers complete in the field—offline ready.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left visuals: scheduling → assignment → builder → driver */}
          <div className="space-y-6">
            {/* A) Smart schedule & dispatch */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Smart schedule & dispatch</h3>
                <CalendarClock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="rounded-xl border bg-background p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium text-foreground">Today’s route</div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold px-2 py-1 text-xs">
                    <Zap className="w-3 h-3" /> Route Optimized
                  </span>
                </div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-foreground">08:15 — Pumping @ Oak Park</span>
                    <span className="rounded-md bg-secondary/10 text-secondary-foreground px-2 py-0.5 text-xs">Auto‑attach: Standard Pump Report</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-foreground">10:40 — Deep Clean @ Riverside</span>
                    <span className="rounded-md bg-secondary/10 text-secondary-foreground px-2 py-0.5 text-xs">Auto‑attach: Checklist + Photos</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-foreground">01:30 — Inspection @ Stadium</span>
                    <span className="rounded-md bg-secondary/10 text-secondary-foreground px-2 py-0.5 text-xs">Auto‑attach: Site Inspection</span>
                  </li>
                </ul>
                <div className="pt-2 text-xs text-muted-foreground">Templates are auto‑assigned by service type, job type, or customer rules.</div>
              </div>
            </article>


            {/* D) Driver completes in the field */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Driver completes in the field</h3>
                <Smartphone className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="rounded-xl border bg-background p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Assigned templates</span>
                  <span className="rounded-md bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold px-2 py-0.5 text-xs">5/6 items completed</span>
                </div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center justify-between"><span className="text-foreground">Standard Pump Report</span><span className="text-muted-foreground">Complete</span></li>
                  <li className="flex items-center justify-between"><span className="text-foreground">Site Checklist</span><span className="text-muted-foreground">In progress</span></li>
                </ul>
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground"><CloudOff className="w-3 h-3" /> Offline queued</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/10 text-secondary-foreground px-2 py-1"><CheckCircle className="w-3 h-3" /> Submit & sync</span>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Photos, signatures, notes — all captured offline and auto‑synced.</div>
            </article>
          </div>

          {/* Right column: Single image */}
          <aside className="space-y-6">
            <img
              src="/src/assets/services-template-builder.png"
              alt="Template builder interface showing customizable service report elements"
              className="w-full h-auto rounded-lg"
              loading="lazy"
              decoding="async"
            />

            <div className="rounded-2xl border bg-card p-5 shadow-md space-y-3">
              <div className="text-base font-semibold text-foreground">What teams love</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Clear checklists prevent missed steps</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Instant proof: photos + signature + timestamp</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> PDF + email with your branding</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Drivers complete reports offline with photos and signatures</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Intuitive template builder: add, reorder, preview, save</li>
              </ul>

            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ServicesHubShowcase;
