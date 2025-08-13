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
          {/* Left visuals: setup + actuals + overage */}
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
              <div className="rounded-xl border bg-background p-4">
                <div className="text-sm font-medium mb-2 text-foreground">Service recipe defaults</div>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Toilet Paper — 2 rolls</li>
                  <li className="flex items-center gap-2"><Droplet className="w-4 h-4 text-muted-foreground" /> Hand Sanitizer — 10 mL</li>
                  <li className="flex items-center gap-2"><Droplet className="w-4 h-4 text-muted-foreground" /> Deodorizer — 30 mL</li>
                </ul>

                <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold px-3 py-2 shadow-md">Included: Hidden on invoice; usage tracked</div>
                  <div className="rounded-lg bg-secondary/10 text-secondary-foreground px-3 py-2">Itemized: Per unit pricing; tech can adjust</div>
                  <div className="rounded-lg bg-accent/10 text-accent-foreground px-3 py-2">Kit: Flat fee + auto overage</div>
                </div>
              </div>
            </article>

            {/* Panel B — Itemized actuals */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Itemized actuals — Field entry</h3>
                <Calculator className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="rounded-xl border bg-background overflow-hidden">
                <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground px-3 py-2">
                  <div>Item</div>
                  <div>Unit</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">$/unit</div>
                  <div className="text-right">Line</div>
                </div>
                <div className="border-t">
                  {[
                    { name: "Toilet Paper", unit: "roll", qty: 3, price: 1.5, total: 4.5 },
                    { name: "Hand Sanitizer", unit: "mL", qty: 15, price: 0.05, total: 0.75 },
                    { name: "Deodorizer", unit: "mL", qty: 40, price: 0.03, total: 1.2 },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-5 items-center px-3 py-2 text-sm">
                      <div className="truncate text-foreground">{row.name}</div>
                      <div className="text-muted-foreground">{row.unit}</div>
                      <div className="text-right">{row.qty}</div>
                      <div className="text-right">${row.price.toFixed(2)}</div>
                      <div className="text-right font-medium">${row.total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-lg bg-primary/10 text-primary px-3 py-1">Cost-plus: price = moving avg cost × (1 + markup)</span>
                <span className="rounded-lg bg-muted px-3 py-1 text-muted-foreground">Offline capture queued — syncs automatically</span>
              </div>
            </article>

            {/* Panel C — Kit + Overage */}
            <article className="rounded-2xl border bg-card shadow-md p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Flat kit fee + overage detection</h3>
                <Package className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="rounded-xl border bg-background p-4 space-y-3">
                <div className="text-sm"><span className="font-medium">Kit includes:</span> 2 rolls TP, 30 mL deodorizer, 10 mL sanitizer</div>
                <div className="text-sm">Used 3 rolls → <span className="font-medium">Overage +1 roll</span> (itemized rate)</div>
                <div className="text-xs rounded-lg bg-accent/10 text-accent-foreground px-3 py-2 inline-flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" /> Auto-add “Overage – Consumables” line to invoice
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <Scan className="w-4 h-4 text-muted-foreground" />
                <span className="rounded-lg bg-muted px-2 py-1 text-muted-foreground">Quick add: scan to add, choose unit type (roll/mL/bottle)</span>
              </div>
            </article>
          </div>

          {/* Right column: KPIs + highlights */}
          <aside className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Overages captured/mo" value={140} icon={Package} animateValue gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" iconBg="hsl(var(--primary))" />
              <StatCard title="Itemized accuracy" value="98.5%" icon={Calculator} gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" iconBg="hsl(var(--primary))" />
              <StatCard title="Avg margin" value="32%" icon={DollarSign} gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" iconBg="hsl(var(--primary))" />
              <StatCard title="Kits adoption" value="65%" icon={ClipboardList} gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" iconBg="hsl(var(--primary))" />
              <StatCard title="Time saved/week" value="4h" icon={Clock} gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" iconBg="hsl(var(--primary))" />
              <StatCard title="Ledger cost tracked" value="100%" icon={CheckCircle} gradientFrom="hsl(var(--primary))" gradientTo="hsl(var(--primary))" iconBg="hsl(var(--primary))" />
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-md">
              <div className="text-base font-semibold mb-3 text-foreground">Highlights</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Set billing at job creation: Included, Itemized actuals, or Kit fee (+ overage)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Pre-built “recipes” per service; techs can adjust in the field</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Cost-plus pricing based on moving average cost</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Works offline — usage syncs later</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> Any unit type: per roll, mL, bottle, custom</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-primary mt-0.5" /> “Scan to add” for fast, error-free logging</li>
              </ul>
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
