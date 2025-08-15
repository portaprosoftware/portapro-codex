import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  FileText,
  Mail,
  MessageSquareText,
  Users,
  Target,
  CalendarClock,
  Send,
  CheckCircle,
} from "lucide-react";

export const MarketingShowcase: React.FC = () => {
  return (
    <section id="marketing" className="py-6 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Marketing</h2>
          <p className="text-muted-foreground">
            Create, target, schedule, and measure. Unlimited texts + emails <span className="font-bold">included</span>. No hidden fees.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold px-3 py-1 text-xs">
              <Sparkles className="w-3 h-3" /> AI builder drafts subject + body in seconds
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-secondary/10 text-secondary-foreground px-3 py-1 text-xs font-medium">
              Schedule ahead or send now • Works with Smart Segments
            </span>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left column: Schedule & Send */}
          <div className="space-y-6">
            {/* Schedule & Send */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Schedule & Send</h3>
                <CalendarClock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="rounded-xl border bg-background p-4 space-y-3">
                <div className="inline-flex rounded-xl border bg-card p-1 text-sm">
                  <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold cursor-default">Send now</div>
                  <div className="px-3 py-1 rounded-lg text-foreground cursor-default">Schedule</div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-sm overflow-visible">
                  <div className="grid gap-1">
                    <label className="text-muted-foreground">Date</label>
                    <input className="rounded-lg border bg-card px-3 py-2" placeholder="2025-09-12" readOnly />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-muted-foreground">Time</label>
                    <input className="rounded-lg border bg-card px-3 py-2" placeholder="09:00 AM" readOnly />
                  </div>
                  <div className="grid gap-1 relative">
                    <label className="text-muted-foreground">Timezone</label>
                    <input className="rounded-lg border bg-card px-3 py-2 overflow-visible whitespace-nowrap min-w-0" placeholder="Eastern / EDT" readOnly style={{width: 'auto', minWidth: '140px'}} />
                  </div>
                </div>
                <div className="text-sm text-foreground">
                  Email + SMS • Template: Spring Promo • Segment: Smart: Inactive 90+ days
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground"><Send className="w-3 h-3" /> Respect unsubscribes & quiet hours</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/10 text-secondary-foreground px-2 py-1">Unlimited texts + emails included — $0 add‑ons</span>
                </div>
              </div>
            </article>
          </div>

          {/* Right column: Audience & Segments + Highlights */}
          <aside className="space-y-6">
            {/* Audience & Smart Segments */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Audience & Segments</h3>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                {[
                  "All Customers",
                  "Smart: Event rentals this week",
                  "Smart: Inactive 90+ days",
                  "Smart: High value accounts",
                  "Custom: VIP corporate",
                ].map((chip) => (
                  <span key={chip} className="rounded-lg bg-muted px-3 py-1 text-muted-foreground">{chip}</span>
                ))}
              </div>
              <div className="text-sm text-foreground">
                2,340 recipients • 187 excluded (unsubscribed, bounced)
              </div>
              <div className="text-xs text-muted-foreground">Preview list and exclusion rules before sending.</div>
            </article>

            <div className="rounded-2xl border bg-card p-5 shadow-md">
              <div className="text-base font-semibold mb-3 text-foreground">Highlights</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Build templates with AI — subject + body in seconds</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Save drafts automatically; resume anytime</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Target all customers or Smart Segments</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Schedule ahead or send instantly; timezone aware</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Real‑time metrics for delivery, opens, clicks, unsubs</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Unlimited texts and emails — included, no hidden fees</li>
              </ul>
            </div>

          </aside>
        </div>
      </div>
    </section>
  );
};

export default MarketingShowcase;