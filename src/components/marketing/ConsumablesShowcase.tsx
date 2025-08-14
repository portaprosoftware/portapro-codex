import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { Droplet, Package, ClipboardList, Calculator, Scan, CheckCircle, DollarSign, Clock } from "lucide-react";

export const ConsumablesShowcase: React.FC = () => {
  return (
    <section id="consumables" className="py-8 bg-white">
      <div className="container mx-auto max-w-6xl px-6">
        <header className="mb-8 space-y-2">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Consumables</h2>
          <p className="text-muted-foreground">
            Toilet paper, hand sanitizer, deodorizer—bill them your way and set it up right in the Job Wizard.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left column: Job Wizard setup + Highlights */}
          <div className="space-y-6">
            {/* Panel A — Job Wizard setup */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Job Wizard — Consumables Billing</h3>
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
              </div>

              {/* Segmented control mock */}
              <div className="inline-flex rounded-xl border bg-background p-1 text-sm mb-4">
                <button className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold shadow-md">Included (bundled)</button>
                <button className="px-3 py-1 rounded-lg text-foreground">Itemized actuals</button>
                <button className="px-3 py-1 rounded-lg text-foreground">Kit fee (+ overage)</button>
              </div>

              {/* Recipe defaults */}
              <div className="rounded-xl border bg-background p-3">
                <div className="text-sm font-medium mb-2 text-foreground">Service recipe defaults</div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Toilet Paper — 2 rolls</li>
                  <li className="flex items-center gap-2"><Droplet className="w-4 h-4 text-muted-foreground" /> Hand Sanitizer — 10 mL</li>
                  <li className="flex items-center gap-2"><Droplet className="w-4 h-4 text-muted-foreground" /> Deodorizer — 30 mL</li>
                </ul>
              </div>
            </article>

            {/* Highlights card moved from right column */}
            <div className="rounded-2xl border bg-card p-5 shadow-md">
              <div className="text-base font-semibold mb-3 text-foreground">Highlights</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Set billing at job creation: Included, Itemized actuals, or Kit fee (+ overage)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Pre-built "recipes" per service; techs can adjust in the field</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Cost-plus pricing based on moving average cost</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Works offline — usage syncs later</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Any unit type: per roll, mL, bottle, custom</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> "Scan to add" for fast, error-free logging</li>
              </ul>
            </div>
          </div>

          {/* Right column: Video + What customers love */}
          <aside className="space-y-6">
            <div className="rounded-2xl border bg-card shadow-md p-6">
              <div className="aspect-video rounded-xl overflow-hidden" dangerouslySetInnerHTML={{
                __html: `
                  <style>
                    wistia-player[media-id='6qvo6ezwgi']:not(:defined) { 
                      background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/6qvo6ezwgi/swatch'); 
                      display: block; 
                      filter: blur(5px); 
                      padding-top:51.04%; 
                    }
                  </style>
                  <wistia-player media-id="6qvo6ezwgi" aspect="1.9591836734693877"></wistia-player>
                `
              }} />
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-md">
              <div className="text-base font-semibold mb-3 text-foreground">What customers love</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Automatic overage detection (no missed revenue)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Transparent itemized billing when needed</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Bundled simplicity when you want it</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default ConsumablesShowcase;