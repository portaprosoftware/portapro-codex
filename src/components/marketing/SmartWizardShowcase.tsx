import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { CalendarClock, CheckCircle, ClipboardList, Truck, Zap } from 'lucide-react';

export const SmartWizardShowcase: React.FC = () => {
  // Static, believable KPIs for a thriving operation
  const kpis = [
    { title: 'Jobs booked this month', value: 148, icon: ClipboardList },
    { title: '99% On-time delivery rate', value: 99, icon: Truck },
  ];

  const steps = ['Customer', 'Dates', 'Units', 'Assign', 'Review'];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Smart Job Wizard</h2>
        <p className="text-muted-foreground text-lg">
          AI capacity planning, real-time availability, crew & vehicle assignment, and instant invoice — all in one flow.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] items-start">
        {/* Left: Static KPIs, video, and highlights */}
        <aside className="space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {kpis.map((k, i) => (
              <StatCard
                key={i}
                title={k.title}
                value={k.value as number}
                icon={k.icon}
                gradientFrom="hsl(var(--primary))"
                gradientTo="hsl(var(--primary) / 0.7)"
                iconBg="hsl(var(--primary))"
                animateValue
              />
            ))}
          </div>

          <div className="rounded-2xl border bg-card shadow-md p-6">
            <div className="text-base font-semibold mb-4 text-foreground">Job Wizard in Action</div>
            <div className="aspect-video bg-muted rounded-xl overflow-hidden">
              <img 
                src="/lovable-uploads/8dc97539-4052-43f9-a9bb-7fb38e588590.png" 
                alt="Smart Job Wizard interface showing customer selection step with search functionality and customer cards"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <ul className="space-y-3" aria-label="Wizard highlights">
            {[
              'Date-range availability with conflict detection',
              'Auto-assign best-fit crew and vehicle',
              'AI recommendations based on guests and event hours',
              'One-click review and invoice generation',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Right: "Make-believe screenshots" stack */}
        <main className="space-y-6 transform origin-top-right scale-[0.8] md:scale-[0.85] lg:scale-[0.8] mt-8">
          {/* Main mock: Create Job */}
          <AspectRatio ratio={16/10}>
            <div className="rounded-2xl border bg-card shadow-lg overflow-hidden animate-fade-in">
              {/* Visual stepper header */}
              <div className="flex items-center gap-3 border-b px-4 py-3 bg-muted/40">
                {steps.map((label, idx) => {
                  const active = label === 'Units';
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className={[
                          'w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-semibold',
                          active ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background text-muted-foreground',
                        ].join(' ')}
                        aria-hidden
                      >
                        {idx + 1}
                      </div>
                      <span className={active ? 'text-foreground font-medium' : 'text-muted-foreground'}>{label}</span>
                      {idx < steps.length - 1 && <span className="text-muted-foreground/60 mx-1">/</span>}
                    </div>
                  );
                })}
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Create Job — Units & Services</h3>
                  </div>
                </div>

                {/* Items list */}
                <div className="rounded-xl border bg-background">
                  <div className="divide-y">
                    {[
                      { name: 'Standard Unit', qty: 12, price: 175 },
                      { name: 'ADA Unit', qty: 1, price: 195 },
                      { name: 'Handwash Station', qty: 2, price: 110 },
                    ].map((row) => (
                      <div key={row.name} className="flex items-center justify-between px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="font-medium text-foreground">{row.name}</div>
                          <div className="text-xs text-muted-foreground">${row.price} ea</div>
                        </div>
                        <div className="text-sm text-muted-foreground">×{row.qty}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="rounded-xl border bg-background">
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Services</div>
                      <div className="text-sm font-medium text-foreground">Mid-week service ×2 (Wed, Fri)</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Service reports auto-generated after each visit</div>
                  </div>
                </div>

                {/* Footer totals */}
                <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
                  <div className="font-semibold text-foreground">Subtotal: $2,515</div>
                  <div className="text-sm text-muted-foreground text-right">
                    <div>Rental: Mon Jan 8 – Fri Jan 12 (4 days)</div>
                    <div>Services: Wed, Fri</div>
                  </div>
                </div>
              </div>
            </div>
          </AspectRatio>

          {/* Support mocks */}
          <div className="grid md:grid-cols-2 gap-4 mt-20 md:mt-24">
            {/* Schedule & Assign */}
            <AspectRatio ratio={4/3}>
              <div className="rounded-2xl border bg-card shadow-md overflow-hidden animate-enter">
                <div className="border-b px-4 py-2 bg-muted/40">
                  <h4 className="text-sm font-semibold text-foreground">Schedule & Assign</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Driver</span>
                    <span className="font-medium text-foreground">M. Lopez</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-medium text-foreground">Truck 12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Route</span>
                    <span className="font-medium text-foreground">Route 4</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-medium text-foreground">Mon Jan 8</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pickup</span>
                    <span className="font-medium text-foreground">Fri Jan 12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Service Days</span>
                    <span className="font-medium text-foreground">Wed, Fri</span>
                  </div>

                  {/* Tiny calendar mock */}
                  <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                    {['S','M','T','W','T','F','S'].map((d, idx) => (
                      <div key={`day-${idx}`} className="text-[10px] text-muted-foreground">{d}</div>
                    ))}
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div
                        key={`date-${i}`}
                        className={[
                          'h-6 rounded-md text-[10px] flex items-center justify-center',
                          i === 7 || i === 9 || i === 11 ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground',
                        ].join(' ')}
                        aria-hidden
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AspectRatio>

            {/* Review & Invoice */}
            <AspectRatio ratio={4/3}>
              <div className="rounded-2xl border bg-card shadow-md overflow-hidden animate-enter">
                <div className="border-b px-4 py-2 bg-muted/40">
                  <h4 className="text-sm font-semibold text-foreground">Review & Invoice</h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Line items</span>
                      <span className="font-medium text-foreground">$2,515</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rental days</span>
                      <span className="font-medium text-foreground">4</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Service visits</span>
                      <span className="font-medium text-foreground">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium text-foreground">$201.20</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Service reports: 2 scheduled (auto-generated)</div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-semibold text-foreground">$2,716.20</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div
                      role="button"
                      aria-hidden
                      className="w-full text-center rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium shadow hover:shadow-md transition hover-scale"
                    >
                      Create Job
                    </div>
                  </div>
                </div>
              </div>
            </AspectRatio>
          </div>
        </main>
      </div>
    </div>
  );
};
