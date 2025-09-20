import React from "react";
import { CampaignConfirmationDemo } from "./CampaignConfirmationDemo";
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

// Declare custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wistia-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'media-id'?: string;
        aspect?: string;
      };
    }
  }
}

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
          {/* Left column: Audience & Segments + Video + Highlights */}
          <div className="space-y-4">
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

            {/* Video Demo */}
            <div className="rounded-lg overflow-hidden animate-fade-in">
              <script src="https://fast.wistia.com/player.js" async></script>
              <script src="https://fast.wistia.com/embed/a2finp2l33.js" async type="module"></script>
              <style dangerouslySetInnerHTML={{__html: `wistia-player[media-id='a2finp2l33']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/a2finp2l33/swatch'); display: block; filter: blur(5px); padding-top:78.54%; }`}} />
              <wistia-player media-id="a2finp2l33" aspect="1.273209549071618"></wistia-player>
            </div>

            {/* Highlights */}
            <div className="rounded-2xl border bg-card p-5 shadow-md animate-fade-in">
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
          </div>

          {/* Right column: Campaign Creation */}
          <aside className="space-y-6">
            {/* Campaign Creation Interface */}
            <div className="animate-fade-in">
              <CampaignConfirmationDemo />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default MarketingShowcase;