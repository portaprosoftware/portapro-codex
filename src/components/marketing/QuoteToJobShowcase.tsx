import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { CheckCircle, FileText, CreditCard, ClipboardList, ArrowRight, DollarSign } from 'lucide-react';

export const QuoteToJobShowcase: React.FC = () => {
  // KPIs removed as requested

  return (
    <div className="space-y-10">
      <header className="space-y-2 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Quote → Deposit → Job, in one flow</h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Build a quote, send it to your customer, collect a deposit with Stripe, and auto-create the job with schedule and invoice.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] items-start">
        {/* Left: Job card + KPIs and highlights */}
        <aside className="space-y-6">
          {/* Job Created moved here */}
          <AspectRatio ratio={4/3}>
            <div className="rounded-2xl border bg-card shadow-md overflow-hidden animate-enter">
              <div className="border-b px-4 py-2 bg-muted/40">
                <h4 className="text-sm font-semibold text-foreground">Job Created from Accepted Quote</h4>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {[ 
                  ['Job #', 'JB-2984'],
                  ['Customer', 'ACME Construction'],
                  ['Location', '1250 Market St, Denver CO'],
                  ['Delivery', 'Mon Jan 8'],
                  ['Pickup', 'Fri Jan 12'],
                  ['Units', '3 Standard, 1 ADA, 1 Handwash'],
                  ['Services', 'Wed, Fri'],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-foreground">{v}</span>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {[
                    'Assigned: Driver M. Lopez',
                    'Vehicle: Truck 12',
                    'Route: 4',
                    'Initial invoice created',
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-xs text-foreground">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AspectRatio>

          {/* Video placeholder */}
          <div className="rounded-2xl border bg-card shadow-md p-6">
            <div className="text-base font-semibold mb-4 text-foreground">Demo Video</div>
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-sm">Video player placeholder</p>
                <p className="text-xs mt-1">Upload your mp4 video here</p>
              </div>
            </div>
          </div>

          <ul className="space-y-3" aria-label="Quote-to-job highlights">
            {[
              'Itemized quotes with units, delivery, services, and taxes',
              'Customer portal with one-click accept & deposit',
              'Stripe payments — card, ACH, Apple Pay, Google Pay',
              'Auto-create job, schedule, and initial invoice on acceptance',
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

        {/* Right: Quote Builder only */}
        <main className="space-y-6">
          {/* Quote Builder */}
          <AspectRatio ratio={16/10}>
            <div className="rounded-2xl border bg-card shadow-lg overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/40">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Quote • Q-1046</h3>
                  <p className="text-xs text-muted-foreground">ACME Construction — 1250 Market St, Denver CO</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow">
                  Awaiting acceptance
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Items table */}
                <div className="rounded-xl border bg-background divide-y">
                  {[
                    { name: 'Standard Unit', qty: 3, price: 35, cycle: '/week' },
                    { name: 'ADA Unit', qty: 1, price: 42, cycle: '/week' },
                    { name: 'Handwash Station', qty: 1, price: 25, cycle: '/week' },
                    { name: 'Delivery Fee', qty: 1, price: 85, cycle: '' },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center justify-between px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{row.name}</div>
                        <div className="text-xs text-muted-foreground">${'{'}row.price{'}'} {row.cycle}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">×{row.qty}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="rounded-xl border bg-muted/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="font-medium text-foreground">$247</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Tax</div>
                    <div className="font-medium text-foreground">$20.28</div>
                  </div>
                  <div className="flex items-center justify-between border-t mt-2 pt-2">
                    <div className="font-semibold text-foreground">Total</div>
                    <div className="font-semibold text-foreground">$267.28</div>
                  </div>
                </div>

                {/* Deposit */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Deposit due (50%)</div>
                  <div className="inline-flex items-center gap-2">
                    <span className="font-semibold text-foreground">$133.64</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">to schedule</span>
                  </div>
                </div>

                {/* Accept CTA (visual only) */}
                <div className="pt-1">
                  <div
                    role="button"
                    aria-hidden
                    className="w-full text-center rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium shadow hover:shadow-md transition hover-scale"
                  >
                    Accept & Pay Deposit
                  </div>
                </div>
              </div>
            </div>
          </AspectRatio>
        </main>
      </div>

      {/* Customer Payment section moved to bottom */}
      <div className="max-w-lg mx-auto">
        <AspectRatio ratio={4/3}>
          <div className="rounded-2xl border bg-card shadow-md overflow-hidden animate-enter">
            <div className="border-b px-4 py-2 bg-muted/40">
              <h4 className="text-sm font-semibold text-foreground">Customer Portal — Secure Payment</h4>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Deposit for Q-1046</div>
                <div className="font-semibold text-foreground">$133.64</div>
              </div>
              <div className="rounded-xl border bg-background p-4 space-y-2">
                <div className="text-sm text-foreground font-medium">Payment method</div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">Card</div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">ACH</div>
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-center">Apple / Google Pay</div>
                </div>
              </div>
              <div className="pt-1">
                <div
                  role="button"
                  aria-hidden
                  className="w-full text-center rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium shadow hover:shadow-md transition hover-scale"
                >
                  Pay $133.64
                </div>
              </div>
            </div>
          </div>
        </AspectRatio>
      </div>
    </div>
  );
};

export default QuoteToJobShowcase;
