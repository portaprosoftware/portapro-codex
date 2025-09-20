import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { CheckCircle, FileText, CreditCard, ClipboardList, ArrowRight, DollarSign } from 'lucide-react';

export const QuoteToJobShowcase: React.FC = () => {
  // KPIs removed as requested

  return (
    <div className="space-y-10 overflow-hidden">
      <header className="space-y-2 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Quote → Deposit → Job → Invoice, in one flow</h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Build a quote, send it to your customer, collect a deposit with Stripe, and auto-create the job with schedule and invoice.
        </p>
      </header>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-start">
        {/* Left: Highlights only */}
        <aside className="space-y-6">
          <ul className="space-y-3" aria-label="Quote-to-job highlights">
            {[
              'Itemized quotes with units, delivery, services, and taxes',
              'Customer portal with one-click accept & deposit',
              'Stripe payments — card, ACH, Apple Pay, Google Pay',
              'Auto-create job, schedule, and initial invoice on acceptance',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
          
          {/* Custom interface cards */}
          <div className="space-y-4">
            {/* Create Job + Quote Card */}
            <div className="bg-card border rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Create Job + Quote</h3>
              <p className="text-sm text-muted-foreground mb-4">Create both a job and quote simultaneously</p>
              <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all shadow">
                Quote + Job
              </button>
            </div>

            {/* Create Job + Invoice Card */}
            <div className="bg-card border rounded-2xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Create Job + Invoice</h3>
              <p className="text-sm text-muted-foreground mb-4">Create job and immediately generate invoice</p>
              <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all shadow">
                Job + Invoice
              </button>
            </div>
          </div>
        </aside>

        {/* Right: Quote Builder */}
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
                    { name: 'Standard Unit', qty: 3, price: 875, cycle: '/week' },
                    { name: 'ADA Unit', qty: 1, price: 1000, cycle: '/week' },
                    { name: 'Handwash Station', qty: 1, price: 400, cycle: '/week' },
                    { name: 'Delivery Fee', qty: 1, price: 85, cycle: '' },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center justify-between px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground">{row.name}</div>
                        <div className="text-xs text-muted-foreground">${row.price}{row.cycle}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">×{row.qty}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="rounded-xl border bg-muted/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Subtotal</div>
                    <div className="font-medium text-foreground">$4,110</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Tax</div>
                    <div className="font-medium text-foreground">$328.80</div>
                  </div>
                  <div className="flex items-center justify-between border-t mt-2 pt-2">
                    <div className="font-semibold text-foreground">Total</div>
                    <div className="font-semibold text-foreground">$4,438.80</div>
                  </div>
                </div>

                {/* Deposit */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Deposit due (50%)</div>
                  <div className="inline-flex items-center gap-2">
                    <span className="font-semibold text-foreground">$2,219.40</span>
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

    </div>
  );
};

export default QuoteToJobShowcase;
