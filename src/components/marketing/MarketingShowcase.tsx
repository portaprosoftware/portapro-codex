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
    <section id="marketing" className="py-6 bg-white overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-6 sm:mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Marketing</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create, target, schedule, and measure. Unlimited texts + emails <span className="font-bold">included</span>. No hidden fees.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold px-2 sm:px-3 py-1 text-xs">
              <Sparkles className="w-3 h-3" /> AI builder drafts subject + body in seconds
            </span>
            <span className="inline-flex items-center gap-2 rounded-md bg-secondary/10 text-secondary-foreground px-2 sm:px-3 py-1 text-xs font-medium">
              Schedule ahead or send now • Works with Smart Segments
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Left column: Video + Audience & Segments */}
          <div className="space-y-4 order-2 lg:order-1">
            {/* Video Demo - Mobile Responsive */}
            <div className="rounded-lg overflow-hidden animate-fade-in w-full">
              <script src="https://fast.wistia.com/player.js" async></script>
              <script src="https://fast.wistia.com/embed/a2finp2l33.js" async type="module"></script>
              <style dangerouslySetInnerHTML={{__html: `wistia-player[media-id='a2finp2l33']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/a2finp2l33/swatch'); display: block; filter: blur(5px); padding-top:78.54%; width: 100%; max-width: 100%; }`}} />
              <wistia-player media-id="a2finp2l33" aspect="1.273209549071618"></wistia-player>
            </div>

            {/* Audience & Smart Segments - Mobile Responsive */}
            <article className="rounded-2xl border bg-card shadow-md p-4 sm:p-5 animate-fade-in w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">Audience & Segments</h3>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2 text-xs mb-3">
                {[
                  "All Customers",
                  "Smart: Event rentals this week",
                  "Smart: Inactive 90+ days",
                  "Smart: High value accounts",
                  "Custom: VIP corporate",
                ].map((chip) => (
                  <span key={chip} className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 sm:px-3 py-1 text-xs break-words font-medium">{chip}</span>
                ))}
              </div>
              <div className="text-xs sm:text-sm text-foreground">
                226 recipients • 187 excluded (unsubscribed, bounced)
              </div>
              <div className="text-xs text-muted-foreground">Preview list and exclusion rules before sending.</div>
            </article>
          </div>

          {/* Right column: Campaign Creation - Mobile First */}
          <div className="order-1 lg:order-2 w-full">
            <div className="animate-fade-in w-full max-w-full">
              <CampaignConfirmationDemo />
            </div>
          </div>
        </div>

        {/* Highlights - Full Width Across Both Columns - Mobile Responsive */}
        <div className="mt-6 sm:mt-8">
          <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-md animate-fade-in">
            <div className="text-sm sm:text-base font-semibold mb-4 text-foreground">Highlights</div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>AI-powered templates & auto-saved drafts</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Smart targeting with scheduling & timezone support</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Real-time metrics + unlimited texts & emails, no hidden fees</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingShowcase;