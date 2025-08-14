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
          {/* Left visuals: template builder → what teams love → schedule & send → segments */}
          <div className="space-y-6">
            {/* A) Template builder with AI magic */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Template builder</h3>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border bg-background p-4 space-y-3">
                  <div className="grid gap-2 text-sm">
                    <label className="text-muted-foreground">Name</label>
                    <input className="rounded-lg border bg-card px-3 py-2 text-sm" placeholder="Spring Promo" readOnly />
                  </div>
                  <div className="grid gap-2 text-sm">
                    <label className="text-muted-foreground">Type</label>
                    <div className="inline-flex rounded-lg border bg-card p-1 text-xs">
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">Email</span>
                      <span className="px-2 py-1 rounded-md text-foreground">SMS</span>
                      <span className="px-2 py-1 rounded-md text-foreground">Both</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold text-sm cursor-default inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Generate with AI
                  </div>
                  <div className="text-xs rounded-md bg-muted px-2 py-1 w-max text-muted-foreground">Draft auto‑saved</div>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <div className="text-sm font-medium text-foreground mb-2">Preview</div>
                  <div className="rounded-lg border bg-card p-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground"><Mail className="w-4 h-4" /> Subject: "Save on weekend rentals"</div>
                    <div className="text-muted-foreground">Hi there — here's a quick offer for your upcoming event...</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold text-sm cursor-default">Use in campaign</div>
                  </div>
                </div>
              </div>
            </article>


            {/* C) Schedule & Send - moved up */}
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

            {/* D) Audience & Smart Segments - moved down */}
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
          </div>

          {/* Right column: Video + highlights */}
          <aside className="space-y-4">
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

            <div className="rounded-2xl border bg-card p-5 shadow-md space-y-3">
              <div className="text-base font-semibold text-foreground">What teams love</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Smart Segments catch revenue you'd otherwise miss</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> AI drafts keep the team moving fast</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> No add‑on bills for messaging — ever</li>
              </ul>

              <div className="pt-2 flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-md bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold text-sm cursor-default inline-flex items-center gap-2"><Send className="w-4 h-4" /> Create Campaign</div>
                <div className="px-3 py-1 rounded-md border text-foreground text-sm cursor-default inline-flex items-center gap-2"><FileText className="w-4 h-4" /> Manage Templates</div>
                <div className="px-3 py-1 rounded-md border text-foreground text-sm cursor-default inline-flex items-center gap-2"><CalendarClock className="w-4 h-4" /> Scheduled Sends</div>
                <div className="px-3 py-1 rounded-md border text-foreground text-sm cursor-default inline-flex items-center gap-2"><Target className="w-4 h-4" /> Smart Segments</div>
                <div className="px-3 py-1 rounded-md border text-foreground text-sm cursor-default inline-flex items-center gap-2"><MessageSquareText className="w-4 h-4" /> Drafts</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default MarketingShowcase;